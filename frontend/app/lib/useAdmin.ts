import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UseAdminReturn {
  isAdmin: boolean;
  loading: boolean;
}

/**
 * Custom hook to check if the connected wallet is the admin (relayer address)
 *
 * @returns {UseAdminReturn} Object containing isAdmin status and loading state
 *
 * @example
 * const { isAdmin, loading } = useAdmin();
 *
 * if (loading) return <div>Loading...</div>;
 * if (isAdmin) return <AdminPanel />;
 */
export function useAdmin(): UseAdminReturn {
  const { address, isConnected } = useAccount();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkAdminStatus() {
      // If wallet is not connected, user is not admin
      if (!isConnected || !address) {
        if (isMounted) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);

        // Fetch the relayer address from the backend
        const response = await fetch(`${API_BASE_URL}/api/relayer/address`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch relayer address: ${response.status}`);
        }

        const result = await response.json();
        const relayerAddress = result.data?.relayerAddress || result.relayerAddress || result.data?.address;

        if (!relayerAddress) {
          console.error('API Response:', result);
          throw new Error('Relayer address not found in response');
        }

        // Compare addresses (case-insensitive)
        const adminStatus = address.toLowerCase() === relayerAddress.toLowerCase();

        if (isMounted) {
          setIsAdmin(adminStatus);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        if (isMounted) {
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkAdminStatus();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [address, isConnected]);

  return { isAdmin, loading };
}
