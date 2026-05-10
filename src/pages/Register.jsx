import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const STEPS = [
  { id: 1, label: "Personal Info", sub: "Name, photo, date of birth" },
  { id: 2, label: "Contact", sub: "Address, phone & email" },
  { id: 3, label: "Security", sub: "Answer security questions" },
];

const VALIDATION_ERRORS = {
  // First Name
  firstNameRequired: "First name is required",
  firstNameNumbers: "Name cannot contain numbers",
  firstNameTooShort: "First name must be at least 2 characters",
  firstNameTooLong: "First name must be less than 50 characters",
  firstNameInvalid: "Name can only contain letters, spaces, hyphens or apostrophes",
  // Last Name
  lastNameRequired: "Last name is required",
  lastNameNumbers: "Name cannot contain numbers",
  lastNameTooShort: "Last name must be at least 2 characters",
  lastNameTooLong: "Last name must be less than 50 characters",
  lastNameInvalid: "Name can only contain letters, spaces, hyphens or apostrophes",
  // Date of Birth
  dobRequired: "Date of birth is required",
  dobTooYoung: "You must be at least 16 years old",
  dobTooOld: "Please enter a valid date of birth",
  dobFuture: "Date of birth cannot be in the future",
  // Gender
  genderRequired: "Please select a gender",
  // Address
  addressRequired: "Street address is required",
  addressTooShort: "Street address must be at least 5 characters",
  addressTooLong: "Street address must be less than 100 characters",
  // City
  cityRequired: "City is required",
  cityNumbers: "City name cannot contain numbers",
  cityTooShort: "City name must be at least 2 characters",
  cityTooLong: "City name must be less than 50 characters",
  cityInvalid: "City can only contain letters and spaces",
  // Country
  countryRequired: "Country is required",
  countryNumbers: "Country name cannot contain numbers",
  countryTooShort: "Country name must be at least 2 characters",
  countryTooLong: "Country name must be less than 50 characters",
  countryInvalid: "Country can only contain letters and spaces",
  // ZIP
  zipRequired: "ZIP / Postal code is required",
  zipInvalid: "Postal code must be 5-10 digits only (no letters or special characters)",
  // Phone
  phoneRequired: "Phone number is required",
  phoneTooShort: "Phone number must be exactly 10 digits",
  phoneStartInvalid: "Phone number must start with 984, 985, 986, or 974",
  // Email
  emailRequired: "Email is required",
  emailTooLong: "Email must be less than 100 characters",
  emailInvalid: "Enter a valid email address",
  emailConsecutiveDots: "Email cannot contain consecutive dots",
  emailDomainInvalid: "Email domain is invalid",
  emailDomainNotAllowed: "We only accept emails from: Gmail, Yahoo, Hotmail, Outlook, ProtonMail, iCloud, and other standard providers",
  emailTypoGmail: "Did you mean gmail.com?",
  emailTypoYahoo: "Did you mean yahoo.com?",
  emailTypoHotmail: "Did you mean hotmail.com?",
  emailTypoOutlook: "Did you mean outlook.com?",
  // Password
  passwordRequired: "Password is required",
  passwordTooShort: "Password must be at least 10 characters",
  passwordTooLong: "Password must be less than 50 characters",
  passwordNeedUpper: "Include at least one uppercase letter (A-Z)",
  passwordNeedLower: "Include at least one lowercase letter (a-z)",
  passwordNeedNumber: "Include at least one number (0-9)",
  passwordNeedSpecial: "Include at least one special character (!@#$%^&* etc)",
  // Confirm Password
  confirmRequired: "Please confirm your password",
  confirmMismatch: "Passwords do not match",
  // Photo
  photoRequired: "Profile photo is required",
  photoTypeInvalid: "Only JPG, PNG or WEBP files allowed",
  photoTooLarge: "File must be under 5MB",
  // Security Questions
  securityQuestionsMin: "Please select and answer at least 2 security questions",
  securityQuestionsNotAnswered: "Please answer all selected security questions",
  // Terms Agreement
  termsRequired: "Please agree to the Terms of Service.",
};

const MESSAGES = {
  sidebarTagline: "Every great journey starts with a",
  sidebarTaglineAccent: "single step.",
  loginPrompt: "Already have an account?",
  loginLink: "Sign in",
  stepBadge: "Step",
  stepOf: "of 3",
  step1Heading: "Tell us about",
  step1HeadingAccent: "yourself",
  step1Subheading: "Your name, date of birth, and a clear profile photo.",
  step2Heading: "How to",
  step2HeadingAccent: "reach you",
  step2Subheading: "Your address, phone number, email and account password.",
  step3Heading: "Secure your",
  step3HeadingAccent: "account",
  step3Subheading: "Set up security questions for password recovery.",
  photoLabel: "Photo",
  uploadProfile: "Profile Photo",
  uploadHint: "Clear face photo. JPG or PNG, max 5MB.",
  personalDetails: "Personal Details",
  selectGender: "Select...",
  male: "Male",
  female: "Female",
  other: "Others",
  addressSection: "Address",
  contactSection: "Contact & Account",
  showPassword: "Show",
  hidePassword: "Hide",
  strength: "Strength:",
  securitySection: "Security Setup (Optional)",
  securityInstructions: "Select and answer security questions for password recovery. You can skip this now and add them later in Settings.",
  answerPlaceholder: "Your answer...",
  selectedQuestions: "You have selected:",
  questions: "question(s)",
  minRequired: "optional - add later in Settings",
  previous: "Back",
  next: "Continue",
  finish: "Complete Registration",
  agreeTerms: "I agree to the Terms of Service and Privacy Policy. My data is handled securely.",
  processRegistering: "Submitting...",
  serverError: "Unable to connect to the server.",
  travelCo: "TravelCo",
};

const FORM_LABELS = {
  firstName: "First Name",
  lastName: "Last Name",
  dob: "Date of Birth",
  gender: "Gender",
  address: "Street Address",
  city: "City",
  zip: "ZIP / Postal Code",
  country: "Country",
  phone: "Phone Number",
  email: "Email",
  password: "Password",
  confirm: "Confirm Password",
};

const STEP_FIELDS = {
  1: ["firstName", "lastName", "dob", "gender"],
  2: ["address", "city", "zip", "country", "phone", "email", "password", "confirm"],
  3: ["security_questions"], // Security questions validation done separately
};

const VALIDATORS = {
  firstName: (v) => {
    if (!v.trim()) return VALIDATION_ERRORS.firstNameRequired;
    if (/\d/.test(v)) return VALIDATION_ERRORS.firstNameNumbers;
    const trimmed = v.trim();
    if (trimmed.length < 2) return VALIDATION_ERRORS.firstNameTooShort;
    if (trimmed.length > 50) return VALIDATION_ERRORS.firstNameTooLong;
    if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) return VALIDATION_ERRORS.firstNameInvalid;
    return "";
  },
  lastName: (v) => {
    if (!v.trim()) return VALIDATION_ERRORS.lastNameRequired;
    if (/\d/.test(v)) return VALIDATION_ERRORS.lastNameNumbers;
    const trimmed = v.trim();
    if (trimmed.length < 2) return VALIDATION_ERRORS.lastNameTooShort;
    if (trimmed.length > 50) return VALIDATION_ERRORS.lastNameTooLong;
    if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) return VALIDATION_ERRORS.lastNameInvalid;
    return "";
  },
  dob: (v) => {
    if (!v) return VALIDATION_ERRORS.dobRequired;
    const dobDate = new Date(v);
    const age = Math.floor((Date.now() - dobDate) / (1000 * 60 * 60 * 24 * 365.25));
    if (age < 16) return VALIDATION_ERRORS.dobTooYoung;
    if (age > 120) return VALIDATION_ERRORS.dobTooOld;
    if (dobDate > new Date()) return VALIDATION_ERRORS.dobFuture;
    return "";
  },
  gender: (v) => (!v ? VALIDATION_ERRORS.genderRequired : ""),
  address: (v) => {
    if (!v.trim()) return VALIDATION_ERRORS.addressRequired;
    const trimmed = v.trim();
    if (trimmed.length < 5) return VALIDATION_ERRORS.addressTooShort;
    if (trimmed.length > 100) return VALIDATION_ERRORS.addressTooLong;
    return "";
  },
  city: (v) => {
    if (!v.trim()) return VALIDATION_ERRORS.cityRequired;
    if (/\d/.test(v)) return VALIDATION_ERRORS.cityNumbers;
    const trimmed = v.trim();
    if (trimmed.length < 2) return VALIDATION_ERRORS.cityTooShort;
    if (trimmed.length > 50) return VALIDATION_ERRORS.cityTooLong;
    if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) return VALIDATION_ERRORS.cityInvalid;
    return "";
  },
  country: (v) => {
    if (!v.trim()) return VALIDATION_ERRORS.countryRequired;
    if (/\d/.test(v)) return VALIDATION_ERRORS.countryNumbers;
    const trimmed = v.trim();
    if (trimmed.length < 2) return VALIDATION_ERRORS.countryTooShort;
    if (trimmed.length > 50) return VALIDATION_ERRORS.countryTooLong;
    if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) return VALIDATION_ERRORS.countryInvalid;
    return "";
  },
  zip: (v) => {
    if (!v.trim()) return VALIDATION_ERRORS.zipRequired;
    const trimmed = v.trim();
    if (!/^\d{5,10}$/.test(trimmed)) return VALIDATION_ERRORS.zipInvalid;
    return "";
  },
  phone: (v) => {
    if (!v.trim()) return VALIDATION_ERRORS.phoneRequired;
    const cleaned = v.replace(/[\s\-().+]/g, "");
    if (!/^\d{10}$/.test(cleaned)) return VALIDATION_ERRORS.phoneTooShort;
    if (!/^(984|985|986|974)\d{7}$/.test(cleaned)) return VALIDATION_ERRORS.phoneStartInvalid;
    return "";
  },
  email: (v) => {
    if (!v.trim()) return VALIDATION_ERRORS.emailRequired;
    const emailLower = v.trim().toLowerCase();
    if (emailLower.length > 100) return VALIDATION_ERRORS.emailTooLong;
    
    // Basic email format validation
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!re.test(emailLower)) return VALIDATION_ERRORS.emailInvalid;
    
    // Check for consecutive dots
    if (/\.\./.test(emailLower)) return VALIDATION_ERRORS.emailConsecutiveDots;
    
    // Extract domain
    const domain = emailLower.split("@")[1];
    if (!domain || domain.length > 50) return VALIDATION_ERRORS.emailDomainInvalid;
    
    // List of allowed legitimate email domains
    const allowedDomains = [
      "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "protonmail.com", "icloud.com",
      "mail.com", "yandex.com", "zoho.com", "gmx.com", "aol.com", "tutanota.com",
      "mailbox.org", "fastmail.com", "posteo.de", "hey.com",
    ];
    
    if (!allowedDomains.includes(domain)) {
      return VALIDATION_ERRORS.emailDomainNotAllowed;
    }
    
    // Check for common typos
    const commonTypos = {
      "gail.com": "gmail", "gmial.com": "gmail", "gamil.com": "gmail", "amil.com": "gmail", "amail.com": "gmail",
      "yaho.com": "yahoo", "yahooo.com": "yahoo", "hotnail.com": "hotmail", "outloo.com": "outlook",
    };
    
    if (commonTypos[domain]) {
      return `Did you mean ${commonTypos[domain]}.com? "${domain}" looks like a typo`;
    }
    
    return "";
  },
  password: (v) => {
    if (!v) return VALIDATION_ERRORS.passwordRequired;
    if (v.length < 10) return VALIDATION_ERRORS.passwordTooShort;
    if (v.length > 50) return VALIDATION_ERRORS.passwordTooLong;
    if (!/[A-Z]/.test(v)) return VALIDATION_ERRORS.passwordNeedUpper;
    if (!/[a-z]/.test(v)) return VALIDATION_ERRORS.passwordNeedLower;
    if (!/[0-9]/.test(v)) return VALIDATION_ERRORS.passwordNeedNumber;
    if (!/[!@#$%^&*()_+={}';:"\\|,.<>/?-]/.test(v)) return VALIDATION_ERRORS.passwordNeedSpecial;
    return "";
  },
  confirm: (v, form) => {
    if (!v) return VALIDATION_ERRORS.confirmRequired;
    if (v !== form.password) return VALIDATION_ERRORS.confirmMismatch;
    return "";
  },
};



export default function RegisterFull() {
  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ Get login function from AuthContext
  const [step, setStep]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [allSecurityQuestions, setAllSecurityQuestions] = useState([]); // Available questions from API
  const [selectedSecurityAnswers, setSelectedSecurityAnswers] = useState({}); // {question_id: answer}

  const [globalError, setGlobalError] = useState("");

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profileFile, setProfileFile]   = useState(null);
  const [photoErrors, setPhotoErrors]   = useState({ profile: "" });
  const profileRef  = useRef();

  const [form, setForm] = useState({
    firstName: "", lastName: "", dob: "", gender: "",
    address: "", city: "", country: "", zip: "",
    phone: "", email: "", password: "", confirm: "",
  });
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});
  const [focused, setFocused] = useState(null);
  const [pwVisible, setPwVisible] = useState(false);
  const [agreed, setAgreed]   = useState(false);

  // ✅ Fetch security questions on mount
  useEffect(() => {
    const fetchSecurityQuestions = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
        const response = await fetch(`${backendUrl}/api/users/security-questions/`);
        const data = await response.json();
        setAllSecurityQuestions(data);
      } catch (err) {
        console.error("Failed to load security questions:", err);
      }
    };
    fetchSecurityQuestions();
  }, []);

  const validate = (field, value) => {
    const fn = VALIDATORS[field];
    return fn ? fn(value, form) : "";
  };

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
    if (touched[k]) setErrors((er) => ({ ...er, [k]: validate(k, val) }));
  };

  const blur = (k) => () => {
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors((er) => ({ ...er, [k]: validate(k, form[k]) }));
    setFocused(null);
  };

  const validateStep = (s) => {
    const fields = STEP_FIELDS[s];
    const newErrors = {};
    const newTouched = {};
    let valid = true;
    for (const f of fields) {
      newTouched[f] = true;
      const err = validate(f, form[f]);
      newErrors[f] = err;
      if (err) valid = false;
    }
    const newPhotoErrors = { ...photoErrors };
    if (s === 1 && !profileFile) { newPhotoErrors.profile = "Profile photo is required"; valid = false; }
    setErrors((er) => ({ ...er, ...newErrors }));
    setTouched((t) => ({ ...t, ...newTouched }));
    setPhotoErrors(newPhotoErrors);
    return valid;
  };

  const handlePhoto = (setter, fileSetter, photoKey) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoErrors((p) => ({ ...p, [photoKey]: "Only JPG, PNG or WEBP files allowed" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoErrors((p) => ({ ...p, [photoKey]: "File must be under 5MB" }));
      return;
    }
    fileSetter(file);
    setPhotoErrors((p) => ({ ...p, [photoKey]: "" }));
    const reader = new FileReader();
    reader.onload = (ev) => setter(ev.target.result);
    reader.readAsDataURL(file);
  };

  const pwStrength = (() => {
    const v = form.password;
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^a-zA-Z0-9]/.test(v)) score++;
    return score;
  })();
  const strengthColor = ["", "text-red-400", "text-yellow-400", "text-blue-400", "text-emerald-400"][pwStrength];
  const strengthBg    = ["", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-emerald-400"][pwStrength];
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][pwStrength];

  const handleNext = (e) => {
    e.preventDefault();
    if (!validateStep(step)) return;
    
    // Validate terms agreement on Step 2 before moving to Step 3
    if (step === 2 && !agreed) {
      setGlobalError("Please agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }
    
    // Validate security questions on Step 4 before submission
    if (step === 4) {
      // Should not reach here as Step 4 submit calls handleSubmit directly
      return;
    }
    
    setStep(step + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(2)) return;
    if (!agreed) { setGlobalError("Please agree to the Terms of Service."); return; }
    
    // ✅ Validate security questions - NOW OPTIONAL (users can add later in Settings)
    const selectedQuestionIds = Object.keys(selectedSecurityAnswers).map(Number);
    
    // Only validate if user selected questions
    if (selectedQuestionIds.length > 0) {
      const allAnswered = selectedQuestionIds.every(qId => selectedSecurityAnswers[qId]?.trim());
      if (!allAnswered) {
        setGlobalError("Please answer all selected security questions");
        return;
      }
    }

    setLoading(true);
    setGlobalError("");
    try {
      const formData = new FormData();
      formData.append("first_name",      form.firstName);
      formData.append("last_name",       form.lastName);
      formData.append("dob",             form.dob);
      formData.append("gender",          form.gender.toLowerCase());
      formData.append("address",         form.address);
      formData.append("city",            form.city);
      formData.append("zip_code",        form.zip);
      formData.append("country",         form.country);
      formData.append("phone",           form.phone);
      formData.append("email",           form.email.trim().toLowerCase());
      formData.append("password",        form.password);
      
      // ✅ Append security questions and answers
      formData.append("security_questions", JSON.stringify(selectedSecurityAnswers));
      
      if (profileFile)  formData.append("profile_photo",  profileFile);

      const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${backendUrl}/api/users/register/`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // ✅ Auto-login: Store JWT token and user
        if (data.access && data.user) {
          localStorage.setItem("access_token", data.access);
          localStorage.setItem("user", JSON.stringify(data.user));
          // Mark as new user to show bot alert
          localStorage.setItem(`isNewUser_${data.user.id}`, "true");
          login(data.user, data.access); // Update AuthContext
        }
        navigate("/home");
      } else {
        setGlobalError(data.message || JSON.stringify(data));
      }
    } catch {
      setGlobalError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };



  const inp = (k) =>
    `w-full bg-white border rounded-xl px-4 py-3 text-sm text-[#111827] placeholder-[#c4bfb7] outline-none transition focus:ring-2 focus:ring-orange-500/10 ${
      errors[k] && touched[k]
        ? "border-red-400 focus:border-red-400"
        : "border-[#e2ddd6] focus:border-orange-500"
    }`;
  const lbl = (k) =>
    `text-[10px] font-bold tracking-[1px] uppercase transition-colors ${
      errors[k] && touched[k] ? "text-red-400" : focused === k ? "text-orange-500" : "text-gray-400"
    }`;
  const errMsg = (k) =>
    errors[k] && touched[k] ? <p className="mt-1 text-[11px] text-red-400">{errors[k]}</p> : null;

  return (
    <div className="flex min-h-screen bg-[#f0ece4] font-[Poppins,sans-serif]">

      {/* Sidebar */}
      <div className="relative hidden w-[280px] flex-shrink-0 flex-col overflow-hidden bg-[#111827] p-10 md:flex">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#111827]/50 to-[#111827]" />
        <div className="relative z-10 flex h-full flex-col">
          <div className="mb-10 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-400 text-base font-bold text-white">T</div>
            <span className="font-['Montserrat'] text-[17px] font-bold text-white">
              Travel<span className="text-orange-500">Co</span>
            </span>
          </div>
          <div className="flex flex-col">
            {STEPS.map((s, i) => (
              <div key={s.id}>
                <div className={`flex items-center gap-3 rounded-xl px-3 py-3 transition ${step === s.id ? "bg-orange-500/13" : ""}`}>
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    step === s.id ? "bg-orange-500 text-white shadow-[0_0_14px_rgba(249,115,22,0.5)]"
                    : step > s.id ? "bg-emerald-400 text-white"
                    : "bg-white/10 text-white/25"
                  }`}>
                    {step > s.id ? "✓" : s.id}
                  </div>
                  <div>
                    <p className={`font-['Montserrat'] text-[13px] font-semibold ${step < s.id ? "text-white/25" : "text-white/85"}`}>{s.label}</p>
                    <p className="text-[10px] text-white/25">{s.sub}</p>
                  </div>
                </div>
                {i < STEPS.length - 1 && <div className="ml-7 h-4 w-px bg-white/10" />}
              </div>
            ))}
          </div>
          <div className="mt-auto">
            <p className="font-['Montserrat'] text-[17px] font-light italic text-white/55 leading-relaxed">
              Every great journey starts with a <span className="text-orange-500">single step.</span>
            </p>
            <p className="mt-4 text-xs text-white/25">
              Already have an account?{" "}
              <a href="/" className="font-semibold text-orange-500 hover:underline">Sign in</a>
            </p>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 items-start justify-center overflow-y-auto px-5 py-12 md:px-10">
        <div className="w-full max-w-[600px]" key={step}>

          <div className="mb-6 h-[3px] overflow-hidden rounded-full bg-[#e2ddd6]">
            <div className="h-full rounded-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }} />
          </div>

          <span className="mb-3 inline-block rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[2.5px] text-orange-500">
            {MESSAGES.stepBadge} {step} {MESSAGES.stepOf}
          </span>
          <h1 className="font-['Montserrat'] text-3xl font-light italic text-[#111827] leading-tight mb-1">
            {step === 1 && <>{MESSAGES.step1Heading} <strong className="font-semibold text-orange-500">{MESSAGES.step1HeadingAccent}</strong></>}
            {step === 2 && <>{MESSAGES.step2Heading} <strong className="font-semibold text-orange-500">{MESSAGES.step2HeadingAccent}</strong></>}
            {step === 3 && <>{MESSAGES.step3Heading} <strong className="font-semibold text-orange-500">{MESSAGES.step3HeadingAccent}</strong></>}
          </h1>
          <p className="mb-7 text-[13px] text-slate-400">
            {step === 1 && MESSAGES.step1Subheading}
            {step === 2 && MESSAGES.step2Subheading}
            {step === 3 && MESSAGES.step3Subheading}
          </p>

          <form onSubmit={step < 2 ? handleNext : (step === 2 ? handleNext : handleSubmit)} noValidate>

            {/* Step 1 */}
            {step === 1 && (
              <>
                <div className="mb-6 flex items-start gap-5">
                  <div>
                    <div
                      onClick={() => profileRef.current.click()}
                      className={`flex h-20 w-20 flex-shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-full border-2 border-dashed bg-white transition hover:border-orange-500 ${
                        photoErrors.profile ? "border-red-400" : "border-[#d0c9be]"
                      }`}
                    >
                      {profilePhoto
                        ? <img src={profilePhoto} alt="profile" className="h-full w-full object-cover" />
                        : <span className="text-[10px] font-bold uppercase tracking-wide text-[#b0a99e]">{MESSAGES.photoLabel}</span>
                      }
                    </div>
                    {photoErrors.profile && <p className="mt-1 text-[11px] text-red-400 text-center w-20">{photoErrors.profile}</p>}
                  </div>
                  <input ref={profileRef} type="file" accept="image/*" className="hidden"
                    onChange={handlePhoto(setProfilePhoto, setProfileFile, "profile")} />
                  <div className="text-[12px] text-gray-400 leading-relaxed">
                    <strong className="block text-[13px] font-semibold text-[#374151]">{MESSAGES.uploadProfile} *</strong>
                    {MESSAGES.uploadHint}
                    <br />This will be reviewed by admin.
                  </div>
                </div>

                <p className="mb-3.5 border-b border-[#e5e0d8] pb-2 text-[10px] font-bold uppercase tracking-[2px] text-gray-400">{MESSAGES.personalDetails}</p>
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <div className="flex flex-col gap-1">
                    <label className={lbl("firstName")}>{FORM_LABELS.firstName} *</label>
                    <input className={inp("firstName")} value={form.firstName} onChange={set("firstName")}
                      onFocus={() => setFocused("firstName")} onBlur={blur("firstName")} placeholder="Jane" />
                    {errMsg("firstName")}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={lbl("lastName")}>{FORM_LABELS.lastName} *</label>
                    <input className={inp("lastName")} value={form.lastName} onChange={set("lastName")}
                      onFocus={() => setFocused("lastName")} onBlur={blur("lastName")} placeholder="Doe" />
                    {errMsg("lastName")}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={lbl("dob")}>{FORM_LABELS.dob} *</label>
                    <input type="date" className={inp("dob")} value={form.dob} onChange={set("dob")}
                      onFocus={() => setFocused("dob")} onBlur={blur("dob")} />
                    {errMsg("dob")}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={lbl("gender")}>{FORM_LABELS.gender} *</label>
                    <select className={inp("gender")} value={form.gender} onChange={set("gender")}
                      onFocus={() => setFocused("gender")} onBlur={blur("gender")}>
                      <option value="">{MESSAGES.selectGender}</option>
                      <option>{MESSAGES.male}</option><option>{MESSAGES.female}</option>
                      <option>{MESSAGES.other}</option>
                    </select>
                    {errMsg("gender")}
                  </div>
                </div>
              </>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <>
                <p className="mb-3.5 border-b border-[#e5e0d8] pb-2 text-[10px] font-bold uppercase tracking-[2px] text-gray-400">{MESSAGES.addressSection}</p>
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <div className="col-span-2 flex flex-col gap-1 max-sm:col-span-1">
                    <label className={lbl("address")}>{FORM_LABELS.address} *</label>
                    <input className={inp("address")} value={form.address} onChange={set("address")}
                      onFocus={() => setFocused("address")} onBlur={blur("address")} placeholder="123 Explorer Street" />
                    {errMsg("address")}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={lbl("city")}>{FORM_LABELS.city} *</label>
                    <input className={inp("city")} value={form.city} onChange={set("city")}
                      onFocus={() => setFocused("city")} onBlur={blur("city")} placeholder="Kathmandu" />
                    {errMsg("city")}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={lbl("zip")}>{FORM_LABELS.zip} *</label>
                    <input className={inp("zip")} value={form.zip} onChange={set("zip")}
                      onFocus={() => setFocused("zip")} onBlur={blur("zip")} placeholder="44600" />
                    {errMsg("zip")}
                  </div>
                  <div className="col-span-2 flex flex-col gap-1 max-sm:col-span-1">
                    <label className={lbl("country")}>{FORM_LABELS.country} *</label>
                    <input className={inp("country")} value={form.country} onChange={set("country")}
                      onFocus={() => setFocused("country")} onBlur={blur("country")} placeholder="Nepal" />
                    {errMsg("country")}
                  </div>
                </div>

                <p className="mb-3.5 mt-6 border-b border-[#e5e0d8] pb-2 text-[10px] font-bold uppercase tracking-[2px] text-gray-400">{MESSAGES.contactSection}</p>
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <div className="flex flex-col gap-1">
                    <label className={lbl("phone")}>{FORM_LABELS.phone} *</label>
                    <input type="tel" className={inp("phone")} value={form.phone} onChange={set("phone")}
                      onFocus={() => setFocused("phone")} onBlur={blur("phone")} placeholder="+977 98XXXXXXXX" />
                    {errMsg("phone")}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={lbl("email")}>{FORM_LABELS.email} *</label>
                    <input type="email" className={inp("email")} value={form.email} onChange={set("email")}
                      onFocus={() => setFocused("email")} onBlur={blur("email")} placeholder="jane@example.com" />
                    {errMsg("email")}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={lbl("password")}>{FORM_LABELS.password} *</label>
                    <div className="relative">
                      <input type={pwVisible ? "text" : "password"} className={inp("password")}
                        style={{ paddingRight: 40 }} value={form.password} onChange={set("password")}
                        onFocus={() => setFocused("password")} onBlur={blur("password")} placeholder="Min. 8 characters" />
                      <button type="button" onClick={() => setPwVisible(!pwVisible)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-35 hover:opacity-75">
                        {pwVisible ? MESSAGES.hidePassword : MESSAGES.showPassword}
                      </button>
                    </div>
                    {form.password.length > 0 && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`h-[3px] w-4 rounded-full transition-all ${pwStrength >= i ? strengthBg : "bg-[#e2ddd6]"}`} />
                          ))}
                        </div>
                        <span className={`text-[10px] font-bold ${strengthColor}`}>{MESSAGES.strength} {strengthLabel}</span>
                      </div>
                    )}
                    {errMsg("password")}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={lbl("confirm")}>{FORM_LABELS.confirm} *</label>
                    <input type="password" className={inp("confirm")} value={form.confirm} onChange={set("confirm")}
                      onFocus={() => setFocused("confirm")} onBlur={blur("confirm")} placeholder="Repeat password" />
                    {errMsg("confirm")}
                  </div>
                </div>

                <div className="mt-5">
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 accent-orange-500" />
                    <span className="text-[12px] text-gray-500 leading-relaxed">
                      {MESSAGES.agreeTerms} <span className="text-red-500 font-bold">*</span>
                    </span>
                  </label>
                  {!agreed && (
                    <div className="mt-2 text-[11px] text-red-500 font-semibold flex items-center gap-1">
                      <span>⚠</span> {VALIDATION_ERRORS.termsRequired}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Step 3 - Security Questions */}
            {step === 3 && (
              <>
                <p className="mb-3.5 border-b border-[#e5e0d8] pb-2 text-[10px] font-bold uppercase tracking-[2px] text-gray-400">{MESSAGES.securitySection}</p>
                <p className="mb-4 text-[13px] text-gray-600">
                  {MESSAGES.securityInstructions}
                </p>

                <div className="space-y-4">
                  {allSecurityQuestions.slice(0, 5).map((q) => (
                    <div key={q.id} className="rounded-xl border border-[#e5e0d8] p-4 hover:border-orange-500 transition">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!selectedSecurityAnswers[q.id]}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSecurityAnswers((prev) => ({ ...prev, [q.id]: "" }));
                            } else {
                              const updated = { ...selectedSecurityAnswers };
                              delete updated[q.id];
                              setSelectedSecurityAnswers(updated);
                            }
                          }}
                          className="mt-0.5 h-4 w-4 flex-shrink-0 accent-orange-500"
                        />
                        <span className="text-[13px] font-semibold text-[#374151]">{q.question}</span>
                      </label>

                      {selectedSecurityAnswers[q.id] !== undefined && (
                        <input
                          type="text"
                          value={selectedSecurityAnswers[q.id] || ""}
                          onChange={(e) =>
                            setSelectedSecurityAnswers((prev) => ({
                              ...prev,
                              [q.id]: e.target.value,
                            }))
                          }
                          placeholder={MESSAGES.answerPlaceholder}
                          className="mt-3 w-full bg-white border border-[#e2ddd6] rounded-xl px-4 py-2 text-sm outline-none transition focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-[12px] text-gray-500">
                  {MESSAGES.selectedQuestions} <strong>{Object.keys(selectedSecurityAnswers).length} {MESSAGES.questions}</strong> • {MESSAGES.minRequired}
                </p>
              </>
            )}

            {globalError && (
              <div className="mt-4 rounded-xl border border-red-300/20 bg-red-400/8 px-4 py-3 text-[13px] text-red-400">
                {globalError}
              </div>
            )}

            <div className="mt-8 flex gap-3">
              {step > 1 && (
                <button type="button" onClick={() => setStep(step - 1)}
                  className="rounded-xl border border-[#e2ddd6] px-5 py-3 text-[13px] font-semibold text-gray-400 transition hover:border-gray-400 hover:text-gray-600">
                  {MESSAGES.previous}
                </button>
              )}
              {step === 3 && (
                <button type="button" onClick={() => setStep(step + 1)}
                  className="rounded-xl border border-[#e2ddd6] px-5 py-3 text-[13px] font-semibold text-gray-400 transition hover:border-gray-400 hover:text-gray-600">
                  Skip
                </button>
              )}
              <button type="submit" disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 py-3.5 text-[14px] font-bold text-white shadow-[0_4px_18px_rgba(249,115,22,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(249,115,22,0.4)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-65">
                {loading
                  ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> {MESSAGES.processRegistering}</>
                  : step < 3 ? MESSAGES.next : MESSAGES.finish
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
