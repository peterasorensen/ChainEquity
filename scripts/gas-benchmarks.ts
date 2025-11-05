#!/usr/bin/env ts-node
/**
 * Gas Benchmarks Script
 *
 * Parses Foundry gas report and compares against PRD targets:
 * - Mint: <100k gas
 * - Approve: <50k gas
 * - Transfer: <100k gas
 * - Revoke: <50k gas
 * - Stock split: <100k gas (per multiplier operation)
 * - Symbol change: <50k gas
 *
 * Usage:
 *   cd contracts && forge test --gas-report > gas-report.txt
 *   npm run gas-benchmarks
 */

import * as fs from 'fs';
import * as path from 'path';

interface GasMetric {
  operation: string;
  actual: number;
  target: number;
  status: 'PASS' | 'FAIL' | 'WARN';
  notes?: string;
}

const GAS_TARGETS: Record<string, { target: number; description: string }> = {
  mint: {
    target: 100000,
    description: 'Mint tokens to approved wallet',
  },
  addToAllowlist: {
    target: 50000,
    description: 'Approve wallet for transfers',
  },
  transfer: {
    target: 100000,
    description: 'Transfer between approved wallets',
  },
  removeFromAllowlist: {
    target: 50000,
    description: 'Revoke wallet approval',
  },
  stockSplit: {
    target: 100000,
    description: 'Execute stock split (multiplier optimization)',
  },
  changeSymbol: {
    target: 50000,
    description: 'Change token symbol',
  },
};

function parseGasReport(reportPath: string): Map<string, number> {
  const gasData = new Map<string, number>();

  if (!fs.existsSync(reportPath)) {
    console.error(`Gas report not found at: ${reportPath}`);
    console.error('Please run: cd contracts && forge test --gas-report > gas-report.txt');
    return gasData;
  }

  const content = fs.readFileSync(reportPath, 'utf-8');
  const lines = content.split('\n');

  // Parse Foundry gas report format
  // Looking for lines like: │ functionName │ min │ avg │ median │ max │ # calls │
  for (const line of lines) {
    if (line.includes('│') && !line.includes('Function Name')) {
      const parts = line.split('│').map((s) => s.trim()).filter((s) => s);

      if (parts.length >= 5) {
        const functionName = parts[0];
        const avgGas = parseInt(parts[2], 10);

        if (functionName && !isNaN(avgGas)) {
          gasData.set(functionName, avgGas);
        }
      }
    }
  }

  return gasData;
}

function analyzeGasMetrics(gasData: Map<string, number>): GasMetric[] {
  const metrics: GasMetric[] = [];

  for (const [operation, { target, description }] of Object.entries(GAS_TARGETS)) {
    const actual = gasData.get(operation);

    if (actual === undefined) {
      metrics.push({
        operation,
        actual: 0,
        target,
        status: 'WARN',
        notes: 'Not measured in gas report',
      });
      continue;
    }

    let status: 'PASS' | 'FAIL' | 'WARN' = 'PASS';
    let notes: string | undefined;

    if (actual > target) {
      status = 'FAIL';
      const excess = ((actual - target) / target * 100).toFixed(1);
      notes = `Exceeds target by ${excess}%`;
    } else if (actual > target * 0.9) {
      status = 'WARN';
      const usage = (actual / target * 100).toFixed(1);
      notes = `Using ${usage}% of target`;
    }

    metrics.push({
      operation,
      actual,
      target,
      status,
      notes,
    });
  }

  return metrics;
}

function generateMarkdownReport(metrics: GasMetric[]): string {
  let markdown = '# Gas Benchmarks Report\n\n';
  markdown += `Generated: ${new Date().toISOString()}\n\n`;

  markdown += '## Summary\n\n';

  const passed = metrics.filter((m) => m.status === 'PASS').length;
  const failed = metrics.filter((m) => m.status === 'FAIL').length;
  const warned = metrics.filter((m) => m.status === 'WARN').length;

  markdown += `- **Passed:** ${passed}/${metrics.length}\n`;
  markdown += `- **Failed:** ${failed}/${metrics.length}\n`;
  markdown += `- **Warnings:** ${warned}/${metrics.length}\n\n`;

  markdown += '## Detailed Results\n\n';
  markdown += '| Operation | Actual Gas | Target Gas | Status | Notes |\n';
  markdown += '|-----------|------------|------------|--------|-------|\n';

  for (const metric of metrics) {
    const statusEmoji = metric.status === 'PASS' ? '✅' : metric.status === 'FAIL' ? '❌' : '⚠️';
    const actualFormatted = metric.actual > 0 ? metric.actual.toLocaleString() : 'N/A';
    const targetFormatted = metric.target.toLocaleString();
    const notes = metric.notes || '-';

    markdown += `| ${metric.operation} | ${actualFormatted} | ${targetFormatted} | ${statusEmoji} ${metric.status} | ${notes} |\n`;
  }

  markdown += '\n## PRD Compliance\n\n';
  markdown += 'Gas targets from PRD requirements:\n\n';
  markdown += '| Operation | Target | Description |\n';
  markdown += '|-----------|--------|-------------|\n';

  for (const [operation, { target, description }] of Object.entries(GAS_TARGETS)) {
    markdown += `| ${operation} | <${target.toLocaleString()} gas | ${description} |\n`;
  }

  markdown += '\n## Optimization Recommendations\n\n';

  const failedMetrics = metrics.filter((m) => m.status === 'FAIL');

  if (failedMetrics.length === 0) {
    markdown += 'All operations meet gas targets. No optimizations required.\n';
  } else {
    markdown += 'The following operations exceed gas targets and should be optimized:\n\n';

    for (const metric of failedMetrics) {
      markdown += `### ${metric.operation}\n\n`;
      markdown += `- **Current:** ${metric.actual.toLocaleString()} gas\n`;
      markdown += `- **Target:** ${metric.target.toLocaleString()} gas\n`;
      markdown += `- **Excess:** ${(metric.actual - metric.target).toLocaleString()} gas\n\n`;

      // Provide specific recommendations
      if (metric.operation === 'mint') {
        markdown += 'Recommendations:\n';
        markdown += '- Use unchecked arithmetic where overflow is impossible\n';
        markdown += '- Minimize storage writes\n';
        markdown += '- Consider batching multiple mints\n';
      } else if (metric.operation === 'addToAllowlist') {
        markdown += 'Recommendations:\n';
        markdown += '- Use packed storage for approval mappings\n';
        markdown += '- Minimize event emission overhead\n';
      } else if (metric.operation === 'transfer') {
        markdown += 'Recommendations:\n';
        markdown += '- Optimize approval checks (use cached values)\n';
        markdown += '- Use unchecked arithmetic for balance updates\n';
        markdown += '- Consider ERC20 optimizations from Solmate\n';
      } else if (metric.operation === 'stockSplit') {
        markdown += 'Recommendations:\n';
        markdown += '- Current implementation uses multiplier optimization\n';
        markdown += '- If still too high, consider virtual balance approach\n';
        markdown += '- Document tradeoffs between gas and complexity\n';
      }

      markdown += '\n';
    }
  }

  markdown += '## Notes\n\n';
  markdown += '- Gas measurements may vary based on network conditions\n';
  markdown += '- Optimizations should balance gas efficiency with code readability\n';
  markdown += '- Some operations may exceed targets due to compliance requirements\n';
  markdown += '- Stock split uses multiplier optimization to avoid iterating through holders\n';

  return markdown;
}

function printConsoleReport(metrics: GasMetric[]) {
  console.log('\n╔═════════════════════════════════════════════════════════════════════╗');
  console.log('║                     Gas Benchmarks Report                           ║');
  console.log('╚═════════════════════════════════════════════════════════════════════╝\n');

  console.log('┌──────────────────────┬─────────────┬─────────────┬────────┐');
  console.log('│ Operation            │ Actual Gas  │ Target Gas  │ Status │');
  console.log('├──────────────────────┼─────────────┼─────────────┼────────┤');

  for (const metric of metrics) {
    const statusEmoji = metric.status === 'PASS' ? '✅' : metric.status === 'FAIL' ? '❌' : '⚠️';
    const actualFormatted = metric.actual > 0
      ? metric.actual.toLocaleString().padStart(11)
      : 'N/A'.padStart(11);
    const targetFormatted = metric.target.toLocaleString().padStart(11);

    console.log(
      `│ ${metric.operation.padEnd(20)} │ ${actualFormatted} │ ${targetFormatted} │ ${statusEmoji}     │`
    );

    if (metric.notes) {
      console.log(`│ ${' '.repeat(20)} │ ${metric.notes.padEnd(54)} │`);
    }
  }

  console.log('└──────────────────────┴─────────────┴─────────────┴────────┘\n');

  const passed = metrics.filter((m) => m.status === 'PASS').length;
  const failed = metrics.filter((m) => m.status === 'FAIL').length;
  const warned = metrics.filter((m) => m.status === 'WARN').length;

  console.log('Summary:');
  console.log(`  ✅ Passed: ${passed}/${metrics.length}`);
  console.log(`  ❌ Failed: ${failed}/${metrics.length}`);
  console.log(`  ⚠️  Warnings: ${warned}/${metrics.length}\n`);
}

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const gasReportPath = path.join(projectRoot, 'contracts', 'gas-report.txt');
  const outputPath = path.join(projectRoot, 'docs', 'gas-benchmarks.md');

  console.log('Parsing gas report...');
  const gasData = parseGasReport(gasReportPath);

  if (gasData.size === 0) {
    console.error('\n❌ No gas data found. Please run:');
    console.error('   cd contracts && forge test --gas-report > gas-report.txt\n');
    process.exit(1);
  }

  console.log(`Found ${gasData.size} gas measurements\n`);

  const metrics = analyzeGasMetrics(gasData);

  // Print to console
  printConsoleReport(metrics);

  // Generate markdown report
  const markdown = generateMarkdownReport(metrics);

  // Ensure docs directory exists
  const docsDir = path.dirname(outputPath);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // Write report
  fs.writeFileSync(outputPath, markdown, 'utf-8');

  console.log(`✅ Report saved to: ${outputPath}\n`);

  // Exit with error code if any tests failed
  const failed = metrics.filter((m) => m.status === 'FAIL').length;
  if (failed > 0) {
    console.error(`❌ ${failed} operation(s) exceed gas targets\n`);
    process.exit(1);
  }

  console.log('✅ All operations meet gas targets\n');
}

main();
