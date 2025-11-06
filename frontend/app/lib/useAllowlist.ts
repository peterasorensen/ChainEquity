import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { checkAllowlist } from './api';

interface UseAllowlistReturn {
  isAllowlisted: boolean;
  loading: boolean;
}

/**
 * Custom hook to check if the connected wallet is on the allowlist
 *
 * @returns {UseAllowlistReturn} Object containing isAllowlisted status and loading state
 *
 * @example
 * const { isAllowlisted, loading } = useAllowlist();
 *
 * if (loading) return <div>Loading...</div>;
 * if (!isAllowlisted) return <div>Access Denied</div>;
 */
export function useAllowlist(): UseAllowlistReturn {
  const { address, isConnected } = useAccount();
  const [isAllowlisted, setIsAllowlisted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkAllowlistStatus() {
      // If wallet is not connected, user is not allowlisted
      if (!isConnected || !address) {
        if (isMounted) {
          setIsAllowlisted(false);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);

        // Call the existing checkAllowlist API function
        const result = await checkAllowlist(address);

        if (isMounted) {
          setIsAllowlisted(result.isApproved);
        }
      } catch (error) {
        console.error('Error checking allowlist status:', error);
        if (isMounted) {
          setIsAllowlisted(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkAllowlistStatus();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [address, isConnected]);

  return { isAllowlisted, loading };
}
