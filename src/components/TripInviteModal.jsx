import React, { useState, useRef, useEffect } from 'react';
import { X, Copy, Mail, Users, Check, AlertCircle, Loader2, Search, UserCheck } from 'lucide-react';

/**
 * TripInviteModal - Social invitation modal
 * Features:
 * - Shareable invite link with one-click copy
 * - Find & invite friends with similar interests
 * - Cosine similarity matching for recommendations
 * - One-click invite from people list
 * - Mobile-first responsive design
 */

const TripInviteModal = ({ tripId, tripTitle, onClose, isOpen, currentUserId, isAdmin = false }) => {
  // ──── STATE ────
  const [activeTab, setActiveTab] = useState('link'); // 'link' | 'people' | 'pending'
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // People/friends list
  const [suggestedPeople, setSuggestedPeople] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [invitedPeople, setInvitedPeople] = useState(new Set());

  // Pending invitations
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);

  const inputRef = useRef(null);

  // ──── EFFECTS ────
  useEffect(() => {
    if (isOpen) {
      generateInviteLink();
      fetchSuggestedPeople();
      fetchPendingInvitations();
    }
  }, [isOpen, tripId]);

  // ──── FUNCTIONS ────

  /**
   * Generate a shareable invite link
   * In production, this would call the backend API
   */
  const generateInviteLink = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`http://127.0.0.1:8000/api/trips/${tripId}/generate-invite-link/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInviteLink(data.link || `${window.location.origin}/invite/${data.code}`);
      } else {
        setError('Failed to generate invite link');
      }
    } catch (err) {
      setError('Failed to generate invite link. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate random alphanumeric code (fallback)
   */
  const generateRandomCode = (length) => {
    return Math.random().toString(36).substring(2, length + 2).toUpperCase();
  };

  /**
   * Copy invite link to clipboard
   */
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy link');
    }
  };

  /**
   * Fetch suggested people based on interest similarity
   */
  const fetchSuggestedPeople = async () => {
    try {
      setLoadingPeople(true);
      setError('');

      const response = await fetch(`http://127.0.0.1:8000/api/users/suggestions/?trip_id=${tripId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const suggestedList = Array.isArray(data) ? data : (data.results || []);
        setSuggestedPeople(suggestedList);
      } else {
        setError('Failed to load suggested people');
        setSuggestedPeople([]);
      }
    } catch (err) {
      setError('Failed to load suggested people');
      console.error(err);
      setSuggestedPeople([]);
    } finally {
      setLoadingPeople(false);
    }
  };

  /**
   * Filter and sort people by search query and priority
   * Priority: 1) Friends 2) Similar interests 3) Name match
   */
  const filteredPeople = suggestedPeople
    .filter(person => {
      // If search is empty, show all
      if (!searchQuery.trim()) return true;
      // Otherwise filter by name or interests
      return (
        person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.interests.some(interest =>
          interest.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    })
    .sort((a, b) => {
      const query = searchQuery.toLowerCase().trim();
      
      // 1. Friends first
      const aIsFriend = a.is_friend ? 1 : 0;
      const bIsFriend = b.is_friend ? 1 : 0;
      if (aIsFriend !== bIsFriend) return bIsFriend - aIsFriend;
      
      // 2. For name search, prioritize exact/close name matches
      if (query) {
        const aNameMatch = a.name.toLowerCase().includes(query) ? 1 : 0;
        const bNameMatch = b.name.toLowerCase().includes(query) ? 1 : 0;
        if (aNameMatch !== bNameMatch) return bNameMatch - aNameMatch;
      }
      
      // 3. Sort by similarity (high first)
      const aSimilarity = a.similarity || 0;
      const bSimilarity = b.similarity || 0;
      if (aSimilarity !== bSimilarity) return bSimilarity - aSimilarity;
      
      // 4. Fallback: alphabetical by name
      return a.name.localeCompare(b.name);
    });

  /**
   * Invite a person to the trip
   */
  const handleInvitePerson = async (personId, personName) => {
    try {
      setLoading(true);
      setError('');

      // Call actual API endpoint
      const response = await fetch(`http://127.0.0.1:8000/api/trips/${tripId}/invitations/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invited_user: personId,
          role: 'member',
        })
      });

      if (response.ok) {
        setInvitedPeople(new Set([...invitedPeople, personId]));
        setSuccess(`Invited ${personName} to the trip!`);
        setTimeout(() => setSuccess(''), 2000);

        // Refresh pending invitations to show updated list
        await fetchPendingInvitations();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to send invitation');
      }
    } catch (err) {
      setError('Failed to send invitation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch pending invitations for this trip
   */
  const fetchPendingInvitations = async () => {
    try {
      setLoadingPending(true);

      // Fetch actual API data
      const response = await fetch(`http://127.0.0.1:8000/api/trips/${tripId}/invitations/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Handle both array and object with results property
        const invitationList = Array.isArray(data) ? data : (data.results || []);
        setPendingInvites(invitationList);
      } else {
        // Start with empty array if no invitations or API not ready
        setPendingInvites([]);
      }
    } catch (err) {
      console.error('Failed to fetch pending invitations:', err);
      // Start with empty array on error
      setPendingInvites([]);
    } finally {
      setLoadingPending(false);
    }
  };

  /**
   * Revoke invitation
   */
  const revokeInvitation = async (inviteId) => {
    try {
      setLoading(true);
      setError('');

      // Call actual API endpoint
      const response = await fetch(`http://127.0.0.1:8000/api/trips/${tripId}/invitations/${inviteId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setPendingInvites(pendingInvites.filter(i => i.id !== inviteId));
        setSuccess('Invitation revoked');
        setTimeout(() => setSuccess(''), 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to revoke invitation');
      }
    } catch (err) {
      setError('Failed to revoke invitation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ──── RENDER ────

  if (!isOpen) return null;

  return (
    <div className="invite-modal-overlay">
      <div className="invite-modal">
        {/* Header */}
        <div className="invite-modal__header">
          <div>
            <h2 className="invite-modal__title">Invite People to {tripTitle}</h2>
            <p className="invite-modal__subtitle">Only you can manage who joins this trip</p>
          </div>
          <button
            className="invite-modal__close"
            onClick={onClose}
            aria-label="Close invite modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="invite-alert invite-alert--error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="invite-alert invite-alert--success">
            <Check size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="invite-tabs">
          <button
            className={`invite-tab ${activeTab === 'link' ? 'invite-tab--active' : ''}`}
            onClick={() => setActiveTab('link')}
          >
            <Copy size={16} />
            <span>Share Link</span>
          </button>
          <button
            className={`invite-tab ${activeTab === 'people' ? 'invite-tab--active' : ''}`}
            onClick={() => setActiveTab('people')}
          >
            <Users size={16} />
            <span>Find Friends</span>
          </button>
          <button
            className={`invite-tab ${activeTab === 'pending' ? 'invite-tab--active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <Check size={16} />
            <span>Pending ({pendingInvites.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="invite-content">
          {/* Share Link Tab */}
          {activeTab === 'link' && (
            <div className="invite-section">
              <div className="invite-section__header">
                <h3>Share Invite Link</h3>
                <p>Anyone with this link can join the trip</p>
              </div>

              {loading ? (
                <div className="invite-loading">
                  <Loader2 size={20} className="invite-spinner" />
                  <p>Generating link...</p>
                </div>
              ) : (
                <div className="invite-link-box">
                  <div className="invite-link-content">
                    <span className="invite-link-text">{inviteLink}</span>
                  </div>
                  <button
                    className={`invite-link-copy ${copied ? 'invite-link-copy--copied' : ''}`}
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <>
                        <Check size={16} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Share Methods */}
              <div className="invite-share-methods">
                <p className="invite-share-methods__label">Quick Share:</p>
                <div className="invite-share-buttons">
                  <button
                    className="invite-share-btn"
                    onClick={() => window.open(`mailto:?body=${encodeURIComponent(`Join my trip! ${inviteLink}`)}`)}
                  >
                    <Mail size={16} />
                    Email
                  </button>
                  <button
                    className="invite-share-btn"
                    onClick={() => {
                      const text = `Join me on this trip! ${inviteLink}`;
                      if (navigator.share) {
                        navigator.share({ title: tripTitle, text });
                      }
                    }}
                  >
                    <Users size={16} />
                    Share
                  </button>
                </div>
              </div>

              {/* Link Info */}
              <div className="invite-info-box">
                <p className="invite-info-title">About this link:</p>
                <ul className="invite-info-list">
                  <li>✓ Works for anyone, anytime</li>
                  <li>✓ No expiration date</li>
                  <li>✓ You can revoke it anytime</li>
                  <li>✓ People will join as Members</li>
                </ul>
              </div>
            </div>
          )}

          {/* Send Invites Tab */}
          {activeTab === 'people' && (
            <div className="invite-section">
              <div className="invite-section__header">
                <h3>Find Friends to Invite</h3>
                <p>People with similar interests as you</p>
              </div>

              {/* Search Input */}
              <div className="invite-form">
                <div className="invite-form__field">
                  <label>Search by name or interest</label>
                  <div className="invite-email-input-wrapper">
                    <Search size={16} className="invite-email-input-icon" />
                    <input
                      type="text"
                      placeholder="Search friends..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="invite-email-input"
                    />
                  </div>
                </div>
              </div>

              {/* People List */}
              {loadingPeople ? (
                <div className="invite-loading">
                  <Loader2 size={20} className="invite-spinner" />
                  <p>Loading friends...</p>
                </div>
              ) : filteredPeople.length === 0 ? (
                <div className="invite-empty-state">
                  <Users size={32} />
                  <p>{searchQuery ? 'No matches found' : 'No suggestions yet'}</p>
                </div>
              ) : (
                <div className="invite-people-list">
                  {filteredPeople.map((person) => {
                    const baseUrl = (process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000/api/").replace('/api/', '');
                    const profilePicUrl = person.profile_picture && (
                      person.profile_picture.startsWith('http') 
                        ? person.profile_picture 
                        : `${baseUrl}${person.profile_picture}`
                    );
                    return (
                    <div key={person.id} className="invite-person-card">
                      <div
                        className="invite-person-avatar"
                        style={
                          profilePicUrl
                            ? {
                                backgroundImage: `url(${profilePicUrl})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }
                            : {}
                        }
                      >
                        {!profilePicUrl && person.avatar}
                      </div>
                      <div className="invite-person-content">
                        <p className="invite-person-name">{person.name}</p>
                        <div className="invite-person-interests">
                          {person.interests.slice(0, 2).map((interest, idx) => (
                            <span key={idx} className="invite-person-tag">
                              {interest}
                            </span>
                          ))}
                        </div>
                        <div className="invite-person-similarity">
                          {Math.round(person.similarity * 100)}% match
                        </div>
                      </div>
                      <button
                        className={`invite-person-btn ${invitedPeople.has(person.id) ? 'invite-person-btn--invited' : ''}`}
                        onClick={() => handleInvitePerson(person.id, person.name)}
                        disabled={loading || invitedPeople.has(person.id)}
                      >
                        {invitedPeople.has(person.id) ? (
                          <>
                            <Check size={16} />
                            <span>Invited</span>
                          </>
                        ) : (
                          <>
                            <Users size={16} />
                            <span>Invite</span>
                          </>
                        )}
                      </button>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Pending Invitations Tab */}
          {activeTab === 'pending' && (
            <div className="invite-section">
              <div className="invite-section__header">
                <h3>Invitation Status</h3>
                <p>Track sent invitations and manage access</p>
              </div>

              {loadingPending ? (
                <div className="invite-loading">
                  <Loader2 size={20} className="invite-spinner" />
                  <p>Loading invitations...</p>
                </div>
              ) : pendingInvites.length === 0 ? (
                <div className="invite-empty-state">
                  <Users size={32} />
                  <p>No invitations sent yet</p>
                </div>
              ) : (
                <div className="invite-pending-list">
                  {pendingInvites.map((invite) => (
                    <div key={invite.id} className="invite-pending-item">
                      {invite.profile_pic && (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            backgroundImage: `url(${invite.profile_pic})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div className="invite-pending-item__info">
                        <p className="invite-pending-item__email">{invite.email}</p>
                        <div className="invite-pending-item__meta">
                          <span
                            className={`invite-pending-item__status invite-pending-item__status--${invite.status}`}
                          >
                            {invite.status === 'accepted' && <Check size={12} />}
                            {invite.status === 'pending' && <AlertCircle size={12} />}
                            <span>{invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}</span>
                          </span>
                          <span className="invite-pending-item__sent">{invite.sentAt}</span>
                        </div>
                      </div>
                      {invite.status === 'pending' && (
                        <button
                          className="invite-pending-item__revoke"
                          onClick={() => revokeInvitation(invite.id)}
                          disabled={loading}
                        >
                          {loading ? <Loader2 size={14} /> : <X size={14} />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="invite-modal__footer">
          <button className="invite-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <style>{inviteModalStyles}</style>
    </div>
  );
};

// ──── STYLES ────
const inviteModalStyles = `
  .invite-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    animation: fadeIn 0.2s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .invite-modal {
    background: #0f1419;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.3s ease-out;
    overflow: hidden;
    margin-top: 4rem;
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .invite-modal__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .invite-modal__title {
    font-family: 'Montserrat', sans-serif;
    font-size: 1.4rem;
    font-weight: 700;
    color: #fff;
    margin-bottom: 0.4rem;
  }

  .invite-modal__subtitle {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .invite-modal__close {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }

  .invite-modal__close:hover {
    color: rgba(255, 255, 255, 0.7);
  }

  /* Alerts */
  .invite-alert {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 1rem 2rem;
    font-size: 0.9rem;
    animation: slideDown 0.2s ease-out;
  }

  @keyframes slideDown {
    from {
      transform: translateY(-10px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .invite-alert--error {
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;
    border-bottom: 1px solid rgba(239, 68, 68, 0.2);
  }

  .invite-alert--success {
    background: rgba(34, 197, 94, 0.1);
    color: #86efac;
    border-bottom: 1px solid rgba(34, 197, 94, 0.2);
  }

  /* Tabs */
  .invite-tabs {
    display: flex;
    gap: 0;
    padding: 0 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(255, 255, 255, 0.01);
  }

  .invite-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 1rem;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.2s;
    border-bottom: 2px solid transparent;
  }

  .invite-tab:hover {
    color: rgba(255, 255, 255, 0.6);
  }

  .invite-tab--active {
    color: #ffd580;
    border-bottom-color: #ffd580;
  }

  /* Content */
  .invite-content {
    flex: 1;
    overflow-y: auto;
    padding: 2rem;
  }

  .invite-content::-webkit-scrollbar {
    width: 6px;
  }

  .invite-content::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
  }

  .invite-content::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  .invite-content::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  /* Section */
  .invite-section {
    animation: fadeIn 0.3s ease-out;
  }

  .invite-section__header {
    margin-bottom: 1.8rem;
  }

  .invite-section__header h3 {
    font-size: 1.1rem;
    font-weight: 700;
    color: #fff;
    margin-bottom: 0.3rem;
  }

  .invite-section__header p {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.4);
  }

  /* Loading */
  .invite-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 2rem;
    color: rgba(255, 255, 255, 0.4);
  }

  .invite-spinner {
    animation: spin 1s linear infinite;
    color: #ffd580;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Link Box */
  .invite-link-box {
    display: flex;
    gap: 0.8rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 213, 128, 0.2);
    border-radius: 12px;
    padding: 0.8rem;
    margin-bottom: 1.5rem;
  }

  .invite-link-content {
    flex: 1;
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .invite-link-text {
    font-size: 0.85rem;
    color: #ffd580;
    word-break: break-all;
    font-family: 'Monaco', 'Courier New', monospace;
  }

  .invite-link-copy {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.6rem 1.2rem;
    background: rgba(255, 213, 128, 0.15);
    border: 1px solid rgba(255, 213, 128, 0.3);
    border-radius: 8px;
    color: #ffd580;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.8rem;
    white-space: nowrap;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .invite-link-copy:hover {
    background: rgba(255, 213, 128, 0.25);
    border-color: rgba(255, 213, 128, 0.4);
  }

  .invite-link-copy--copied {
    background: rgba(34, 197, 94, 0.1);
    border-color: rgba(34, 197, 94, 0.3);
    color: #86efac;
  }

  /* Share Methods */
  .invite-share-methods {
    margin-bottom: 2rem;
  }

  .invite-share-methods__label {
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.4);
    margin-bottom: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .invite-share-buttons {
    display: flex;
    gap: 0.8rem;
  }

  .invite-share-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 0.8rem 1rem;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    font-weight: 600;
    font-size: 0.85rem;
    transition: all 0.2s;
  }

  .invite-share-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    border-color: rgba(255, 255, 255, 0.15);
  }

  /* Info Box */
  .invite-info-box {
    background: rgba(59, 130, 246, 0.08);
    border: 1px solid rgba(59, 130, 246, 0.15);
    border-radius: 10px;
    padding: 1.2rem;
  }

  .invite-info-title {
    font-size: 0.8rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.8rem;
  }

  .invite-info-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .invite-info-list li {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.4);
    padding: 0.4rem 0;
  }

  /* Form */
  .invite-form {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    margin-bottom: 1.8rem;
  }

  .invite-form__field {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .invite-form__field label {
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .invite-email-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .invite-email-input-icon {
    position: absolute;
    left: 1rem;
    color: rgba(255, 255, 255, 0.3);
    pointer-events: none;
  }

  .invite-email-input {
    width: 100%;
    padding: 0.8rem 1rem 0.8rem 2.8rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: #fff;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .invite-email-input:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 213, 128, 0.3);
    box-shadow: 0 0 0 3px rgba(255, 213, 128, 0.1);
  }

  .invite-email-input::placeholder {
    color: rgba(255, 255, 255, 0.25);
  }

  /* Suggestions */
  .invite-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 0.4rem;
    background: #1a1f2e;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    overflow: hidden;
    z-index: 10;
    max-height: 200px;
    overflow-y: auto;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  }

  .invite-suggestion {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.8rem 1rem;
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    width: 100%;
    text-align: left;
    transition: background 0.15s;
  }

  .invite-suggestion:hover {
    background: rgba(255, 213, 128, 0.08);
  }

  .invite-suggestion__avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255, 213, 128, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffd580;
    font-weight: 700;
    font-size: 0.85rem;
    flex-shrink: 0;
  }

  .invite-suggestion__name {
    font-size: 0.85rem;
    color: #fff;
    font-weight: 600;
    margin-bottom: 0.2rem;
  }

  .invite-suggestion__email {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
  }

  /* Role Select */
  .invite-role-select {
    width: 100%;
    padding: 0.8rem 1rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: #fff;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .invite-role-select:hover {
    border-color: rgba(255, 213, 128, 0.2);
    background: rgba(255, 255, 255, 0.05);
  }

  .invite-role-select:focus {
    outline: none;
    border-color: rgba(255, 213, 128, 0.3);
    box-shadow: 0 0 0 3px rgba(255, 213, 128, 0.1);
  }

  /* Add Button */
  .invite-add-btn {
    padding: 0.8rem 1rem;
    background: rgba(255, 213, 128, 0.15);
    border: 1px solid rgba(255, 213, 128, 0.3);
    border-radius: 10px;
    color: #ffd580;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .invite-add-btn:hover:not(:disabled) {
    background: rgba(255, 213, 128, 0.25);
    border-color: rgba(255, 213, 128, 0.4);
  }

  .invite-add-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* List */
  .invite-list {
    margin-bottom: 1.8rem;
  }

  .invite-list h4 {
    font-size: 0.9rem;
    font-weight: 700;
    color: #fff;
    margin-bottom: 1rem;
  }

  .invite-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.8rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    margin-bottom: 0.6rem;
    animation: slideDown 0.2s ease-out;
  }

  .invite-item__content {
    flex: 1;
    min-width: 0;
  }

  .invite-item__email {
    font-size: 0.85rem;
    color: #fff;
    margin-bottom: 0.2rem;
  }

  .invite-item__role {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    text-transform: capitalize;
  }

  .invite-item__remove {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.3);
    cursor: pointer;
    padding: 0.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
    margin-left: 0.8rem;
  }

  .invite-item__remove:hover {
    color: #f87171;
  }

  /* Send Button */
  .invite-send-btn {
    width: 100%;
    padding: 0.9rem 1.2rem;
    background: linear-gradient(135deg, #f97316, #ea580c);
    border: none;
    border-radius: 10px;
    color: #fff;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    transition: opacity 0.2s;
  }

  .invite-send-btn:hover:not(:disabled) {
    opacity: 0.9;
  }

  .invite-send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Empty State */
  .invite-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 3rem 1rem;
    color: rgba(255, 255, 255, 0.3);
  }

  .invite-empty-state svg {
    width: 48px;
    height: 48px;
  }

  .invite-empty-state p {
    font-size: 0.95rem;
  }

  /* Pending List */
  .invite-pending-list {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .invite-pending-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    animation: slideDown 0.2s ease-out;
  }

  .invite-pending-item__info {
    flex: 1;
  }

  .invite-pending-item__email {
    font-size: 0.9rem;
    color: #fff;
    font-weight: 600;
    margin-bottom: 0.4rem;
  }

  .invite-pending-item__meta {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .invite-pending-item__status {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.3rem 0.8rem;
    border-radius: 6px;
  }

  .invite-pending-item__status--pending {
    background: rgba(245, 158, 11, 0.1);
    color: #fbbf24;
  }

  .invite-pending-item__status--accepted {
    background: rgba(34, 197, 94, 0.1);
    color: #86efac;
  }

  .invite-pending-item__status--declined {
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;
  }

  .invite-pending-item__sent {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.3);
  }

  .invite-pending-item__revoke {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    transition: all 0.2s;
    margin-left: 1rem;
  }

  .invite-pending-item__revoke:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }

  .invite-pending-item__revoke:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* Footer */
  .invite-modal__footer {
    padding: 1.5rem 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(255, 255, 255, 0.01);
  }

  .invite-btn-secondary {
    width: 100%;
    padding: 0.8rem 1rem;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: rgba(255, 255, 255, 0.6);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .invite-btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    border-color: rgba(255, 255, 255, 0.15);
  }

  /* People List */
  .invite-people-list {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .invite-person-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    transition: all 0.2s;
    animation: slideDown 0.2s ease-out;
  }

  .invite-person-card:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 213, 128, 0.15);
  }

  .invite-person-avatar {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: linear-gradient(135deg, #f97316, #ea580c);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 700;
    font-size: 0.85rem;
    flex-shrink: 0;
  }

  .invite-person-content {
    flex: 1;
    min-width: 0;
  }

  .invite-person-name {
    font-size: 0.9rem;
    font-weight: 700;
    color: #fff;
    margin-bottom: 0.4rem;
  }

  .invite-person-interests {
    display: flex;
    gap: 0.4rem;
    margin-bottom: 0.4rem;
    flex-wrap: wrap;
  }

  .invite-person-tag {
    display: inline-block;
    font-size: 0.7rem;
    padding: 0.2rem 0.6rem;
    background: rgba(255, 213, 128, 0.1);
    color: #ffd580;
    border-radius: 4px;
    border: 1px solid rgba(255, 213, 128, 0.2);
    font-weight: 600;
  }

  .invite-person-similarity {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    font-weight: 600;
  }

  .invite-person-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    background: rgba(255, 213, 128, 0.15);
    border: 1px solid rgba(255, 213, 128, 0.3);
    border-radius: 8px;
    color: #ffd580;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.8rem;
    white-space: nowrap;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .invite-person-btn:hover:not(:disabled) {
    background: rgba(255, 213, 128, 0.25);
    border-color: rgba(255, 213, 128, 0.4);
  }

  .invite-person-btn--invited {
    background: rgba(34, 197, 94, 0.1);
    border-color: rgba(34, 197, 94, 0.3);
    color: #86efac;
  }

  .invite-person-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .invite-modal {
      max-width: 95vw;
      max-height: 85vh;
    }

    .invite-modal__header {
      padding: 1.5rem;
    }

    .invite-content {
      padding: 1.5rem;
    }

    .invite-modal__footer {
      padding: 1.2rem 1.5rem;
    }

    .invite-tabs {
      padding: 0 1.5rem;
    }

    .invite-tab {
      font-size: 0.75rem;
    }

    .invite-tab svg {
      width: 14px;
      height: 14px;
    }

    .invite-link-box {
      flex-direction: column;
    }

    .invite-link-copy {
      width: 100%;
      justify-content: center;
    }

    .invite-share-buttons {
      flex-direction: column;
    }

    .invite-share-btn {
      width: 100%;
    }

    .invite-form {
      gap: 1rem;
    }

    .invite-pending-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.8rem;
    }

    .invite-pending-item__meta {
      width: 100%;
    }

    .invite-pending-item__revoke {
      align-self: flex-end;
      margin-left: 0;
    }

    .invite-person-card {
      flex-wrap: wrap;
    }

    .invite-person-avatar {
      order: 1;
    }

    .invite-person-content {
      order: 2;
      width: 100%;
    }

    .invite-person-btn {
      order: 3;
      width: 100%;
      justify-content: center;
      margin-top: 0.5rem;
    }
  }
`;

export default TripInviteModal;
