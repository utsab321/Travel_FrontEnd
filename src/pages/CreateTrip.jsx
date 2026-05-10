import { useState, useEffect } from "react";
import API from "../services/api";
import Sidebar from "../components/Sidebar";
import { useNavigate, Link } from "react-router-dom";
import { X, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import KYCBanner from "../components/KYCBanner";

// ──── CONSTANTS ────
const COLORS = {
  primary: "#1976D2",
  primaryDark: "#1565c0",
  golden: "#f0c27a",
  goldenDark: "#c9973a",
  darkBg: "#0a0c16",
  white10: "rgba(255, 255, 255, 0.1)",
  white20: "rgba(255, 255, 255, 0.2)",
  white40: "rgba(255, 255, 255, 0.4)",
  white60: "rgba(255, 255, 255, 0.6)",
};

const FORM_LABELS = {
  tripTitle: "Trip Title *",
  destination: "Destination *",
  startDate: "Start Date *",
  endDate: "End Date *",
  description: "Description",
  coverImage: "Trip Cover Photo",
  expenses: "Trip Budget & Expenses",
  tags: "Trip Tags (Diet, Lifestyle, Values)",
  isPublic: "Make this trip public (other travelers can find it)",
};

const TEXTS = {
  heading: "Create a New Trip",
  fillRequired: "Please fill in all required fields",
  failedCreate: "Failed to create trip",
  creating: "Creating...",
  createTrip: "Create Trip",
  kycRequired: "Complete KYC verification to create trips",
  addExpense: "Add Expense",
  expenseCategory: "Category",
  expenseAmount: "Amount",
  totalExpense: "Total Expense",
  noExpenses: "No expenses added yet",
  errorAddingTrip: "Error creating trip",
};

const inp = "w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition";

const getApiUrl = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
  return backendUrl
};
const token = () => localStorage.getItem("access_token");

export default function CreateTrip() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    destination_id: "",
    start_date: "",
    end_date: "",
    description: "",
    is_public: true
  });

  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({ category: "", amount: "" });


  const [cities, setCities] = useState([]);
  const [allConstraintTags, setAllConstraintTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [kycLoading, setKycLoading] = useState(true);

  // Fetch cities, constraint tags, and user profile
  useEffect(() => {
    const fetchData = async () => {
      try {
        const citiesRes = await API.get("/api/trips/cities/");
        setCities(citiesRes.data || []);

        const tagsRes = await fetch(`${getApiUrl()}/api/users/constraint-tags/`, {
          headers: { Authorization: `Bearer ${token()}` },
        });
        const tagsData = await tagsRes.json();
        setAllConstraintTags(tagsData);
        
        // Fetch user profile for KYC status
        const profileRes = await fetch(`${getApiUrl()}/api/users/me/`, {
          headers: { Authorization: `Bearer ${token()}` },
        });
        const profileData = await profileRes.json();
        setUserProfile(profileData);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setTagsLoading(false);
        setKycLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddExpense = () => {
    if (newExpense.category.trim() && newExpense.amount.trim()) {
      const amount = parseFloat(newExpense.amount);
      if (!isNaN(amount) && amount > 0) {
        setExpenses([...expenses, { id: Date.now(), category: newExpense.category, amount }]);
        setNewExpense({ category: "", amount: "" });
      }
    }
  };

  const handleRemoveExpense = (id) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
  };

  const calculateTotalExpense = () => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  const groupedTags = allConstraintTags.reduce((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = [];
    acc[tag.category].push(tag);
    return acc;
  }, {});

  const selectedTags = allConstraintTags.filter(t => selectedTagIds.includes(t.id));

  const toggleTag = (tagId, category) => {
    setSelectedTagIds(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        // Remove other tags from same category and add this one
        const otherTags = prev.filter(id => {
          const otherTag = allConstraintTags.find(t => t.id === id);
          return otherTag?.category !== category;
        });
        return [...otherTags, tagId];
      }
    });
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.title || !form.destination_id || !form.start_date || !form.end_date) {
      setError(TEXTS.fillRequired);
      return;
    }

    // Validate that start date is not before today
    const today = getTodayDate();
    if (form.start_date < today) {
      setError("Trip start date cannot be before today");
      return;
    }

    // Validate that end date is not before start date
    if (form.end_date < form.start_date) {
      setError("End date cannot be before start date");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Step 1: Create the trip
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("destination_id", parseInt(form.destination_id));
      formData.append("start_date", form.start_date);
      formData.append("end_date", form.end_date);
      formData.append("description", form.description);
      formData.append("is_public", form.is_public);
      if (coverImage) {
        formData.append("cover_image", coverImage);
      }

      // Add constraint tags as array
      selectedTagIds.forEach((tagId, index) => {
        formData.append(`constraint_tag_ids[${index}]`, tagId);
      });

      const tripRes = await fetch(`${getApiUrl()}/api/trips/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: formData
      });

      if (!tripRes.ok) {
        const errData = await tripRes.json();
        throw new Error(errData.detail || TEXTS.failedCreate);
      }

      const tripData = await tripRes.json();
      const tripId = tripData.id;

      // Step 2: Add expenses if any
      if (expenses.length > 0) {
        for (const expense of expenses) {
          const expenseRes = await fetch(`${getApiUrl()}/api/trips/${tripId}/expenses/`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token()}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              category: expense.category,
              amount: expense.amount
            })
          });

          if (!expenseRes.ok) {
            console.error("Error adding expense:", await expenseRes.json());
            // Don't throw, just log the error - trip was still created
          }
        }
      }

      navigate(`/trip/${tripId}`);
    } catch (err) {
      setError(err.message || TEXTS.failedCreate);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };



  // KYC blocking screen
  if (kycLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-[#07080f] to-[#0d0e1a] font-['Syne']">
        <div className="text-center animate-pulse">
          <div className="text-5xl mb-6 animate-spin">⌛</div>
          <div className="text-lg text-white mb-3 font-bold tracking-tight">Loading...</div>
          <div className="text-sm text-white/40">Verifying access permissions</div>
        </div>
      </div>
    );
  }

  if (userProfile && userProfile.status && userProfile.status !== "approved") {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-[#07080f] to-[#0d0e1a] font-['Syne']">
        <div className="text-center max-w-sm p-10 bg-white/3 border border-[#f0c27a]/15 rounded-2xl animate-fadeIn shadow-2xl">
          <div className="text-6xl mb-5">🔐</div>
          <div className="text-2xl text-white mb-3 font-bold tracking-tight">
            {userProfile.status === "pending"
              ? "KYC Verification Pending"
              : userProfile.status === "under_review"
              ? "KYC Under Review"
              : "KYC Verification Required"}
          </div>
          <div className="text-sm text-white/50 leading-relaxed mb-6">
            {userProfile.status === "pending"
              ? "Your KYC verification is pending. Please submit your documents to unlock trip creation."
              : userProfile.status === "under_review"
              ? "Your KYC verification is currently under review. We'll notify you once it's approved."
              : "You need to complete KYC verification to create trips."}
          </div>
          <Link
            to="/kyc"
            className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-[#c9973a] to-[#f0c27a] text-[#0f0e0d] font-bold text-sm tracking-wider hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            {userProfile.status === "under_review" ? "View Status" : "Complete KYC"}
          </Link>
          <div className="text-xs text-white/30 mt-4">
            KYC is required for safety & security
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0c16]">
      <Sidebar />

      <div className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* KYC Banner */}
        {userProfile && <KYCBanner status={userProfile.status} rejectionReason={userProfile.rejection_reason} />}

        <div className="max-w-3xl mt-6">
          <h2 className="text-3xl font-bold text-white mb-8">{TEXTS.heading}</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: COLORS.white40 }}>{FORM_LABELS.tripTitle}</label>
              <input
                name="title"
                placeholder="e.g., Summer Europe Adventure"
                value={form.title}
                onChange={handleChange}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition"
              />
            </div>

            {/* Destination */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: COLORS.white40 }}>{FORM_LABELS.destination}</label>
              <select
                name="destination_id"
                value={form.destination_id}
                onChange={handleChange}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition"
              >
                <option value="">Select a city...</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>
                    {city.name}, {city.country}
                  </option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-white/40">Start Date *</label>
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  min={getTodayDate()}
                  className={inp}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-white/40">End Date *</label>
                <input
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={handleChange}
                  min={form.start_date || getTodayDate()}
                  className={inp}
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-white/40">{FORM_LABELS.description}</label>
              <textarea
                name="description"
                placeholder="Tell others about your trip..."
                value={form.description}
                onChange={handleChange}
                rows={4}
                className={`${inp} resize-none`}
              />
            </div>

            {/* Cover Image Upload */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: COLORS.white40 }}>{FORM_LABELS.coverImage}</label>
              
              <div className="relative">
                <label className="flex items-center justify-center w-full h-40 border-2 border-dashed border-white/20 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition">
                  {coverImagePreview ? (
                    <img src={coverImagePreview} alt="Cover preview" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <ImageIcon size={32} className="text-white/40 mb-2" />
                      <span className="text-sm text-white/60">Click to upload cover image</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="hidden"
                  />
                </label>
                {coverImagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImage(null);
                      setCoverImagePreview(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded hover:bg-red-600 transition"
                  >
                    <X size={16} className="text-white" />
                  </button>
                )}
              </div>
            </div>

            {/* Expenses Section */}
            <div className="flex flex-col gap-3 p-4 rounded-lg border border-white/10 bg-white/5">
              <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: COLORS.white40 }}>{FORM_LABELS.expenses}</label>
              
              {/* Add Expense Form */}
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g., Bus, Room, Food"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    className={inp}
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className={inp}
                    step="0.01"
                    min="0"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddExpense}
                  className="w-full flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition"
                >
                  <Plus size={18} />
                  {TEXTS.addExpense}
                </button>
              </div>

              {/* Expenses List */}
              {expenses.length > 0 ? (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{expense.category}</p>
                        <p className="text-xs text-white/60">${expense.amount.toFixed(2)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExpense(expense.id)}
                        className="ml-2 p-1 hover:bg-red-500/20 rounded transition"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/40 py-2">{TEXTS.noExpenses}</p>
              )}

              {/* Total Expense */}
              {expenses.length > 0 && (
                <div className="mt-2 pt-3 border-t border-white/10 flex justify-between items-center">
                  <span className="text-sm font-semibold text-white">{TEXTS.totalExpense}:</span>
                  <span className="text-lg font-bold" style={{ color: COLORS.golden }}>${calculateTotalExpense().toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Constraint Tags */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-white/40">Trip Tags (Diet, Lifestyle, Values)</label>
              
              {/* Selected tags */}
              <div className="flex flex-wrap gap-2">
                {selectedTags.length > 0 ? (
                  selectedTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id, tag.category)}
                      className="rounded-full px-3 py-1.5 text-[11px] font-semibold bg-[#1976D2] border border-[#1976D2] text-white flex items-center gap-1.5 hover:bg-[#1565c0] transition"
                    >
                      {tag.name}
                      <X size={12} />
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-white/30 italic">Select tags to match with similar travelers...</p>
                )}
              </div>
              
              {/* Dropdown */}
              <div className="relative z-50">
                <button
                  type="button"
                  onClick={() => setTagsOpen(!tagsOpen)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-white/60 hover:border-[#1976D2]/50 transition"
                >
                  + Add tags
                </button>
                
                {tagsOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d1117] border border-white/10 rounded-lg shadow-2xl z-50 max-h-64 overflow-y-auto">
                    {tagsLoading ? (
                      <div className="px-4 py-3 text-sm text-white/40">Loading tags...</div>
                    ) : (
                      Object.entries(groupedTags).map(([category, tags]) => (
                        <div key={category}>
                          <div className="sticky top-0 px-3 py-2 bg-white/5 border-b border-white/10 text-[10px] font-bold uppercase text-white/40">
                            {category.replace('_', ' ')}
                          </div>
                          {tags.map((tag) => (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => toggleTag(tag.id, tag.category)}
                              className={`w-full text-left px-4 py-2.5 text-sm transition border-b border-white/5 last:border-0 ${
                                selectedTagIds.includes(tag.id)
                                  ? "bg-[#1976D2]/20 text-white font-semibold"
                                  : "text-white/60 hover:bg-white/5 hover:text-white"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                {selectedTagIds.includes(tag.id) ? "✓" : " "} {tag.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* is_public */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_public"
                checked={form.is_public}
                onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                className="w-4 h-4 rounded border-white/10"
              />
              <label className="text-sm text-white/70">Make this trip public (other travelers can find it)</label>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm" style={{ color: "#f87171" }}>
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !userProfile || userProfile.status !== 'approved'}
              className="w-full rounded-lg py-3 text-sm font-bold text-white transition hover:bg-[#1565c0] disabled:opacity-50 disabled:cursor-not-allowed" 
              style={{ backgroundColor: COLORS.primary }}
              title={!userProfile || userProfile.status !== 'approved' ? TEXTS.kycRequired : ''}
            >
              {loading ? TEXTS.creating : TEXTS.createTrip}
            </button>
            {(!userProfile || userProfile.status !== 'approved') && (
              <p className="text-center text-xs text-amber-400 mt-2">{TEXTS.kycRequired}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}