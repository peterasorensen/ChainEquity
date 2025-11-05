// Mock for @react-native-async-storage/async-storage
// This is needed because MetaMask SDK imports this React Native dependency
// but we're building for web only

export default {
  getItem: async (_key: string) => null,
  setItem: async (_key: string, _value: string) => {},
  removeItem: async (_key: string) => {},
  clear: async () => {},
  getAllKeys: async () => [],
  multiGet: async (_keys: string[]) => [],
  multiSet: async (_keyValuePairs: [string, string][]) => {},
  multiRemove: async (_keys: string[]) => {},
};
