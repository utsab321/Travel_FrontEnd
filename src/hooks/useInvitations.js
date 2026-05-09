import { useState, useCallback } from 'react';
import api from '../API/api';

/**
 * useInvitations - Custom hook for managing trip invitations
 * Handles all invitation logic including API calls, state management, and validation
 */

export const useInvitations = (tripId) => {
  const [inviteLink, setInviteLink] = useState('');
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /**
   * Generate a new invite link for the trip
   */
  const generateInviteLink = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // TODO: Replace with actual API endpoint
      const response = await api.post(`/api/trips/${tripId}/generate-invite-link/`);
      setInviteLink(response.data.invite_link);

      // Mock implementation
      // const code = generateRandomCode(8);
      // const link = `${window.location.origin}/invite/${tripId}/${code}`;
      // setInviteLink(link);
    } catch (err) {
      setError('Failed to generate invite link');
      console.error('Generate invite link error:', err);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  /**
   * Regenerate invite link (invalidates old link)
   */
  const regenerateInviteLink = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // TODO: Replace with actual API endpoint
      const response = await api.post(`/api/trips/${tripId}/regenerate-invite-link/`);
      setInviteLink(response.data.link);

      // Mock implementation
      // const code = generateRandomCode(8);
      // const link = `${window.location.origin}/invite/${tripId}/${code}`;
      // setInviteLink(link);
      setSuccess('Invite link regenerated');
    } catch (err) {
      setError('Failed to regenerate invite link');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  /**
   * Send direct invitation to a user
   */
  const sendInvitation = useCallback(async (emails, role = 'member') => {
    try {
      setLoading(true);
      setError('');

      // Validate emails
      if (!Array.isArray(emails) || emails.length === 0) {
        throw new Error('No emails provided');
      }

      // TODO: Replace with actual API endpoint
      const response = await api.post(`/api/trips/${tripId}/invitations/`, {
        emails: emails,
        role: role,
      });

      // Mock implementation - simulate API call
      // await new Promise(resolve => setTimeout(resolve, 500));

      setSuccess(`Successfully sent ${emails.length} invitation(s)`);
      await fetchPendingInvitations();
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invitations');
      return false;
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  /**
   * Fetch pending invitations for the trip
   */
  const fetchPendingInvitations = useCallback(async () => {
    try {
      // TODO: Replace with actual API endpoint
      const response = await api.get(`/api/trips/${tripId}/invitations/`);
      setPendingInvites(response.data);

      // Mock implementation
      // setPendingInvites([]);
    } catch (err) {
      console.error('Fetch pending invitations error:', err);
    }
  }, [tripId]);

  /**
   * Accept an invitation (for invited users)
   */
  const acceptInvitation = useCallback(async (inviteId) => {
    try {
      setLoading(true);
      setError('');

      // TODO: Replace with actual API endpoint
      await api.patch(`/api/trips/${tripId}/invitations/${inviteId}/`, {
        action: 'accept',
      });

      setSuccess('Invitation accepted');
      await fetchPendingInvitations();
      return true;
    } catch (err) {
      setError('Failed to accept invitation');
      return false;
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  /**
   * Decline an invitation (for invited users)
   */
  const declineInvitation = useCallback(async (inviteId) => {
    try {
      setLoading(true);
      setError('');

      // TODO: Replace with actual API endpoint
      await api.patch(`/api/trips/${tripId}/invitations/${inviteId}/`, {
        action: 'decline',
      });

      setSuccess('Invitation declined');
      await fetchPendingInvitations();
      return true;
    } catch (err) {
      setError('Failed to decline invitation');
      return false;
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  /**
   * Revoke/cancel an invitation (for trip creators/admins)
   */
  const revokeInvitation = useCallback(async (inviteId) => {
    try {
      setLoading(true);
      setError('');

      // TODO: Replace with actual API endpoint
      await api.delete(`/api/trips/${tripId}/invitations/${inviteId}/`);

      // Mock implementation
      setPendingInvites(pendingInvite=>pendingInvites.filter(i => i.id !== inviteId));

      setSuccess('Invitation revoked');
      return true;
    } catch (err) {
      setError('Failed to revoke invitation');
      return false;
    } finally {
      setLoading(false);
    }
  }, [tripId, pendingInvites]);

  /**
   * Clear alert messages
   */
  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  /**
   * Helper: Generate random code
   */
    // const generateRandomCode = (length) => {
    //   return Math.random().toString(36).substring(2, length + 2).toUpperCase();
    // };

  return {
    // State
    inviteLink,
    pendingInvites,
    loading,
    error,
    success,

    // Methods
    generateInviteLink,
    regenerateInviteLink,
    sendInvitation,
    fetchPendingInvitations,
    acceptInvitation,
    declineInvitation,
    revokeInvitation,
    clearMessages,
  };
};

export default useInvitations;
