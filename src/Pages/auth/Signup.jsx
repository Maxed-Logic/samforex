import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';
import { FaCopy, FaCheck, FaUser, FaIdCard, FaEye, FaEyeSlash } from "react-icons/fa";
import './auth.css';
import apiClient from "../../api/apiClient";
import { IoIosArrowDropdown } from "react-icons/io";

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // ==================== COUNTRY STATES ====================
  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // ==================== PASSWORD STATE ====================
  const [showPassword, setShowPassword] = useState(false);

  // ==================== SPONSOR STATE ====================
  const [sponsorNameDisplay, setSponsorNameDisplay] = useState("");

  const [formData, setFormData] = useState({
    introRegNo: "",
    fName: "",
    lName: "",
    mobile: "",
    email: "",
    password: "",
    address: "N/A",
    referrer: "",
    referrer_Id: "",
    affiliate_Level: 1,
    sponsorName: "",
    walletAddress: "",
    countryId: "",
    countryCode: "",
  });

  // ==================== TOAST FUNCTIONS ====================
  const showSuccessToast = (message) => {
    toast.success(message, {
      duration: 4000,
      position: 'top-center',
      style: {
        background: '#4CAF50',
        color: '#fff',
        padding: '16px 24px',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '600',
        boxShadow: '0 8px 25px rgba(76, 175, 80, 0.4)',
        textAlign: 'center',
      },
    });
  };

  const showErrorToast = (message) => {
    toast.error(message, {
      duration: 4000,
      position: 'top-center',
      style: {
        background: '#dc3545',
        color: '#fff',
        padding: '16px 24px',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '600',
        boxShadow: '0 8px 25px rgba(220, 53, 69, 0.4)',
        textAlign: 'center',
      },
    });
  };

  // ==================== FETCH COUNTRIES ====================
  useEffect(() => {
    const fetchCountries = async () => {
      setCountriesLoading(true);
      try {
        const response = await apiClient.get("/Auth/GetAllCountries");
        if (response.data?.result === "true" && Array.isArray(response.data.response)) {
          const activeCountries = response.data.response.filter(country => country.cActive === true);
          setCountries(activeCountries);
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
        showErrorToast("Failed to load countries");
      } finally {
        setCountriesLoading(false);
      }
    };
    fetchCountries();
  }, []);

  // ==================== CLICK OUTSIDE ====================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (open && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setCountrySearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // ==================== FILTERED COUNTRIES ====================
  const filteredCountries = countries.filter((country) =>
    country.countryName?.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.CCode?.toString().includes(countrySearch)
  );

  // ==================== HANDLE COUNTRY SELECT ====================
  const handleCountrySelect = (country) => {
    setFormData(prev => ({
      ...prev,
      countryId: country.CID,
      countryCode: country.CCode
    }));
    setOpen(false);
    setCountrySearch("");
    searchInputRef.current?.blur();
  };

  // ==================== TOGGLE PASSWORD ====================
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // ==================== COPY FUNCTION ====================
  const handleCopy = (text, field) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopiedField(field);
          showSuccessToast(`${field} copied!`);
          setTimeout(() => setCopiedField(null), 2000);
        })
        .catch(() => {
          fallbackCopy(text, field);
        });
    } else {
      fallbackCopy(text, field);
    }
  };

  const fallbackCopy = (text, field) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.width = '1px';
    textArea.style.height = '1px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const success = document.execCommand('copy');
      if (success) {
        setCopiedField(field);
        showSuccessToast(`${field} copied!`);
        setTimeout(() => setCopiedField(null), 2000);
      } else {
        showErrorToast(`Failed to copy ${field}`);
      }
    } catch (err) {
      showErrorToast(`Failed to copy ${field}`);
      console.error('Copy failed:', err);
    }

    document.body.removeChild(textArea);
  };

  // ==================== FETCH SPONSOR ====================
  const fetchSponsorDetails = async (sponsorId) => {
    if (!sponsorId || !sponsorId.trim()) {
      setSponsorNameDisplay("");
      return;
    }

    try {
      const response = await apiClient.get(`/Auth/UserDetailsById?loingId=${sponsorId}`);
      if (response.data?.result === "true" && response.data.user) {
        const sponsorName = response.data.user.fName || response.data.user.LoginID;

        setFormData(prev => ({
          ...prev,
          sponsorName: sponsorName,
          referrer: sponsorName,
          introRegNo: response.data.user.regNo,
        }));

        setSponsorNameDisplay(`✓ Verified`);
        showSuccessToast(`Sponsor: ✓ Verified`);
      } else {
        setFormData(prev => ({
          ...prev,
          sponsorName: "Invalid Sponsor",
          referrer: "",
          introRegNo: ""
        }));
        setSponsorNameDisplay("Invalid Sponsor");
        showErrorToast(" Invalid Sponsor ID!");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setFormData(prev => ({
        ...prev,
        sponsorName: "Invalid Sponsor",
        referrer: "",
        introRegNo: ""
      }));
      setSponsorNameDisplay("Invalid Sponsor");
    }
  };

  // ==================== URL REF CODE ====================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref");
    if (refCode && !formData.referrer_Id) {
      setFormData(prev => ({
        ...prev,
        referrer_Id: refCode,
        introRegNo: refCode,
      }));
      fetchSponsorDetails(refCode);
    }
  }, []);

  // ==================== HANDLE CHANGE ====================
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "introRegNo") {
      setFormData((prev) => ({ ...prev, referrer_Id: value }));
      fetchSponsorDetails(value);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
  };

  const handleGoToLogin = () => {
    setShowSuccessModal(false);
    navigate("/login");
  };

  // ==================== SIGNUP ====================
  const handleSignup = async (e) => {
    e.preventDefault();

    if (!formData.sponsorName || formData.sponsorName === "Invalid Sponsor") {
      showErrorToast(" Please enter a valid Sponsor ID!");
      return;
    }

    if (!formData.mobile || formData.mobile.length !== 10) {
      showErrorToast(" Valid 10-digit mobile number required!");
      return;
    }

    if (!formData.email || !formData.email.includes('@')) {
      showErrorToast(" Valid email address required!");
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      showErrorToast(" Password must be at least 8 characters!");
      return;
    }

    if (!formData.countryId) {
      showErrorToast(" Please select a country!");
      return;
    }

    setLoading(true);

    const payload = {
      introRegNo: parseInt(formData.introRegNo) || 0,
      fName: formData.fName.trim(),
      lName: formData.lName.trim() || "",
      mobile: formData.mobile.toString(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      address: formData.address || "N/A",
      referrer: formData.referrer.trim() || formData.sponsorName,
      referrer_Id: formData.referrer_Id.toString(),
      affiliate_Level: parseInt(formData.affiliate_Level) || 1,
      countryId: formData.countryId,
      countryCode: formData.countryCode,
    };

    try {
      const response = await apiClient.post("/Auth/Register", payload);

      if (response.data?.result === "true" && response.data?.response) {
        const userResponse = response.data.response;

        const regnoValue = userResponse.Regno || userResponse.regno;
        const loginIdValue = userResponse.LoginID || userResponse.loginid;

        const userObject = {
          regno: regnoValue,
          Regno: regnoValue,
          loginid: loginIdValue,
          LoginID: loginIdValue,
          name: formData.fName + " " + formData.lName,
          fname: formData.fName,
          mobile: formData.mobile,
          email: userResponse.emailID || formData.email,
          introregno: parseInt(formData.introRegNo) || 0,
          directid: 0,
          walletAddress: formData.walletAddress || "",
          countryId: formData.countryId,
          countryCode: formData.countryCode,
        };

        sessionStorage.setItem("user", JSON.stringify(userObject));

        setRegisteredUser({
          regno: regnoValue,
          loginId: loginIdValue,
          name: formData.fName + " " + formData.lName,
          email: userResponse.emailID || formData.email,
          mobile: formData.mobile,
          sponsorId: formData.referrer_Id,
          sponsorName: formData.sponsorName,
          password: formData.password,
        });

        setShowSuccessModal(true);
        showSuccessToast(" Registration Successful!");

      } else {
        let errorMsg = "Registration Failed";
        if (response.data?.message) {
          if (Array.isArray(response.data.message)) {
            errorMsg = response.data.message.join(", ");
          } else {
            errorMsg = response.data.message;
          }
        }
        showErrorToast(`${errorMsg}`);
        console.error("API Error:", response.data);
      }
    } catch (error) {
      console.error("Signup Error:", error);

      let errorMsg = "Please check your connection.";

      if (error.response) {
        errorMsg = error.response.data?.message || error.response.statusText || "Server Error";
        console.error("Error Response:", error.response.data);
      } else if (error.request) {
        errorMsg = "No response from server! Please check your internet connection.";
        console.error("Error Request:", error.request);
      }

      showErrorToast(`${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            padding: '16px 24px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            textAlign: 'center',
          },
          success: {
            style: {
              background: '#4CAF50',
              color: '#fff',
              boxShadow: '0 8px 25px rgba(76, 175, 80, 0.4)',
            },
          },
          error: {
            style: {
              background: '#dc3545',
              color: '#fff',
              boxShadow: '0 8px 25px rgba(220, 53, 69, 0.4)',
            },
          },
        }}
      />

      <div className="mediic-appoinment">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="auth-form">
                <div className="mediic-section-title22">
                  <div className="d-flex justify-content-between align-items-center flex-wrap mb-3">
                    <div>
                      <h4 className="mb-1">SIGNUP ACCOUNT</h4>
                      <h3 className="Sign-text mb-0">Sign up to your account</h3>
                    </div>
                  </div>

                  <form onSubmit={handleSignup}>
                    <div className="row">

                      {/* Sponsor ID */}
                      <div className="col-lg-12">
                        <div className="form-box">
                          <input
                            type="text"
                            name="introRegNo"
                            placeholder="Sponsor ID"
                            value={formData.referrer_Id}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      {/* Sponsor Name (Readonly) */}
                      <div className="col-lg-12">
                        <div className="form-box">
                          <input
                            type="text"
                            value={sponsorNameDisplay}
                            readOnly
                            placeholder="Sponsor Name"
                            className="readonly-input"
                            style={{
                              color:
                                sponsorNameDisplay === "Invalid Sponsor" ||
                                sponsorNameDisplay === "Invalid Sponsor"
                                  ? "#ff0000"
                                  : "#008202",
                              fontWeight: "600",
                            }}
                          />
                        </div>
                      </div>

                      {/* Full Name */}
                      <div className="col-lg-12">
                        <div className="form-box">
                          <input
                            type="text"
                            name="fName"
                            placeholder="Full Name*"
                            value={formData.fName}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      {/* ✅ EMAIL INPUT (Simple — No OTP) */}
                      <div className="col-lg-12">
                        <div className="form-box">
                          <input
                            type="email"
                            name="email"
                            placeholder="Email Address*"
                            value={formData.email}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      {/* Country */}
                      <div className="col-lg-12">
                        <div className="form-box">
                          <div className="country-wrapper" ref={dropdownRef} style={{ position: "relative" }}>

                            <input
                              ref={searchInputRef}
                              type="text"
                              placeholder=" Search Country..."
                              value={
                                open
                                  ? countrySearch
                                  : formData.countryId
                                    ? countries.find((c) => c.CID === formData.countryId)?.countryName || ""
                                    : ""
                              }
                              onChange={(e) => {
                                if (!open) setOpen(true);
                                setCountrySearch(e.target.value);
                              }}
                              onFocus={() => {
                                setOpen(true);
                                setCountrySearch("");
                              }}
                              autoComplete="off"
                              style={{
                                width: "100%",
                                height: "50px",
                                padding: "0 45px 0 20px",
                                borderRadius: "12px",
                                backgroundColor: "rgba(255, 255, 255, 0)",
                                border: "1px solid rgba(0, 37, 112, 0.5)",
                                fontWeight: "500",
                                fontFamily: "DM Sans, sans-serif",
                                fontSize: "16px",
                                color: formData.countryId ? "#333" : "#999",
                                outline: "none",
                                boxSizing: "border-box",
                              }}
                            />

                            <IoIosArrowDropdown
                              onClick={() => {
                                setOpen(!open);
                                if (!open) {
                                  setCountrySearch("");
                                  setTimeout(() => searchInputRef.current?.focus(), 100);
                                }
                              }}
                              style={{
                                position: "absolute",
                                right: "16px",
                                top: "50%",
                                transform: `translateY(-50%) rotate(${open ? "180deg" : "0deg"})`,
                                fontSize: "22px",
                                color: "#666",
                                transition: "transform 0.3s ease",
                                cursor: "pointer",
                                zIndex: 2,
                              }}
                            />

                            {open && (
                              <div
                                className="country-dropdown"
                                style={{
                                  position: "absolute",
                                  top: "calc(100% + 4px)",
                                  left: 0,
                                  right: 0,
                                  backgroundColor: "#fff",
                                  border: "1px solid #ddd",
                                  borderRadius: "12px",
                                  boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
                                  zIndex: 9999,
                                  overflow: "hidden",
                                  maxHeight: "260px",
                                  overflowY: "auto",
                                }}
                              >
                                {countriesLoading ? (
                                  <div style={{ padding: "16px 20px", textAlign: "center", color: "#666" }}>
                                    Loading countries...
                                  </div>
                                ) : filteredCountries.length === 0 ? (
                                  <div style={{ padding: "16px 20px", textAlign: "center", color: "#999", fontSize: "14px" }}>
                                    No country found
                                  </div>
                                ) : (
                                  filteredCountries.map((country) => (
                                    <div
                                      key={country.CID}
                                      className="country-item"
                                      onClick={() => handleCountrySelect(country)}
                                      style={{
                                        padding: "12px 20px",
                                        cursor: "pointer",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        transition: "background 0.2s ease",
                                        fontSize: "15px",
                                        fontFamily: "DM Sans, sans-serif",
                                        fontWeight: "500",
                                        color: "#333",
                                        borderBottom: "1px solid #f5f5f5",
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f4ff")}
                                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                    >
                                      <span>{country.countryName}</span>
                                      <span style={{ color: "#666", fontSize: "13px" }}>+{country.CCode}</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Mobile */}
                      <div className="col-lg-12">
                        <div className="form-box d-flex" style={{ gap: "10px", alignItems: "center" }}>
                          <div>
                            <span style={{
                              padding: "14px 16px",
                              background: "#e8e8e8",
                              borderRadius: "12px",
                              display: "inline-block",
                              fontWeight: "600",
                              fontSize: "13px",
                              minWidth: "60px",
                              textAlign: "center",
                              marginTop: "-8px"
                            }}>
                              {formData.countryCode ? `+${formData.countryCode}` : "+00"}
                            </span>
                          </div>
                          <input
                            type="text"
                            name="mobile"
                            placeholder="Mobile Number*"
                            maxLength="10"
                            value={formData.mobile}
                            onChange={handleChange}
                            required
                            style={{ flex: 1 }}
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="col-lg-12">
                        <div className="form-box" style={{ position: 'relative' }}>
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Create Password (min 8 characters)"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            style={{ paddingRight: '50px' }}
                          />
                          <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            style={{
                              position: 'absolute',
                              right: '14px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#6c757d',
                              fontSize: '20px',
                              padding: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 2,
                              borderRadius: '50%',
                              transition: 'all 0.2s ease'
                            }}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f0f0'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>

                      <div className="col-lg-12">
                        <p className="text-black">
                          Already have an account?
                          <a href="/login" onClick={(e) => {
                            e.preventDefault();
                            navigate("/login");
                          }}><span className="text-primary ms-2">Login Here</span></a>
                        </p>
                      </div>

                      {/* Submit Button */}
                      <div className="col-lg-12 mt-4">
                        <button
                          type="submit"
                          className="laboix-btn"
                          disabled={loading}
                          style={{
                            opacity: loading ? 0.6 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {loading ? "Creating Account..." : "Signup Now"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && registeredUser && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.3s ease'
        }}>
          <div className="success-modal02" onClick={(e) => e.stopPropagation()} style={{
            background: 'white',
            borderRadius: '24px',
            maxWidth: '520px',
            width: '92%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
            animation: 'slideUp 0.4s ease',
            padding: '0'
          }}>
            <div className="modal-header02" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
              background: '#667eea',
              borderRadius: '24px 24px 0 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="success-icon02" style={{
                  width: '48px',
                  height: '48px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>✓</div>
                <div className="Registration-text" style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  color: '#ffffff'
                }}>Registration Successful</div>
              </div>
              <button className="modal-close" onClick={handleModalClose} style={{
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#fff',
                transition: 'all 0.3s ease',
                padding: '0 12px',
                lineHeight: '1',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                justifyContent: 'center'
              }}>×</button>
            </div>

            <div className="modal-body02" style={{
              padding: '20px 16px',
              maxWidth: '100%',
              overflow: 'hidden'
            }}>
              <div className="user-details-card02" style={{
                background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                borderRadius: '16px',
                padding: '20px 16px',
                marginBottom: '20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '1px solid #f0f0f0'
              }}>

                <div className="Account-text" style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#1a1a1a',
                  paddingBottom: '12px',
                  borderBottom: '2px solid #667eea',
                  letterSpacing: '0.3px'
                }}>
                  <FaIdCard style={{ color: '#667eea', fontSize: '18px', flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap' }}>Your Account Details</span>
                </div>

                {/* Login ID */}
                <div className="detail-row02" style={{
                  display: 'flex', alignItems: 'center', padding: '12px 0',
                  borderBottom: '1px solid #f0f0f0', gap: '10px',
                  flexWrap: 'nowrap', minHeight: '44px'
                }}>
                  <div className="detail-label02" style={{
                    fontWeight: '600', color: '#555', whiteSpace: 'nowrap',
                    flexShrink: 0, fontSize: '13px', width: '100px',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    <FaUser style={{ color: '#667ea5', fontSize: '13px' }} />
                    <span>Login ID</span>
                    <span style={{ color: '#999', fontSize: '12px' }}>:</span>
                  </div>
                  <div className="detail-value02" style={{
                    fontWeight: '600', color: '#1a1a1a', whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis', flex: 1,
                    minWidth: 0, fontSize: '14px', display: 'flex',
                    alignItems: 'center', justifyContent: 'flex-end', gap: '6px'
                  }}>
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                      {registeredUser.loginId}
                    </span>
                    <button className="copy-btn02" onClick={() => handleCopy(registeredUser.loginId, "Login ID")} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: copiedField === "Login ID" ? '#4CAF50' : '#667ea5',
                      fontSize: '15px', transition: 'all 0.3s ease',
                      padding: '4px 6px', flexShrink: 0, display: 'flex',
                      alignItems: 'center', borderRadius: '4px',
                      background: copiedField === "Login ID" ? 'rgba(76, 175, 80, 0.1)' : 'transparent'
                    }}>
                      {copiedField === "Login ID" ? <FaCheck /> : <FaCopy />}
                    </button>
                  </div>
                </div>

                {/* Sponsor ID */}
                <div className="detail-row02" style={{
                  display: 'flex', alignItems: 'center', padding: '12px 0',
                  borderBottom: '1px solid #f0f0f0', gap: '10px',
                  flexWrap: 'nowrap', minHeight: '44px'
                }}>
                  <div className="detail-label02" style={{
                    fontWeight: '600', color: '#555', whiteSpace: 'nowrap',
                    flexShrink: 0, fontSize: '13px', width: '100px',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    <FaUser style={{ color: '#667ea5', fontSize: '13px' }} />
                    <span>Sponsor ID</span>
                    <span style={{ color: '#999', fontSize: '12px' }}>:</span>
                  </div>
                  <div className="detail-value02" style={{
                    fontWeight: '600', color: '#1a1a1a', whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis', flex: 1,
                    minWidth: 0, fontSize: '14px', display: 'flex',
                    alignItems: 'center', justifyContent: 'flex-end', gap: '6px'
                  }}>
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                      {registeredUser.sponsorId}
                    </span>
                    <button className="copy-btn02" onClick={() => handleCopy(registeredUser.sponsorId, "Sponsor ID")} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: copiedField === "Sponsor ID" ? '#4CAF50' : '#667ea5',
                      fontSize: '15px', transition: 'all 0.3s ease',
                      padding: '4px 6px', flexShrink: 0, display: 'flex',
                      alignItems: 'center', borderRadius: '4px',
                      background: copiedField === "Sponsor ID" ? 'rgba(76, 175, 80, 0.1)' : 'transparent'
                    }}>
                      {copiedField === "Sponsor ID" ? <FaCheck /> : <FaCopy />}
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div className="detail-row02" style={{
                  display: 'flex', alignItems: 'center', padding: '12px 0',
                  gap: '10px', flexWrap: 'nowrap', minHeight: '44px'
                }}>
                  <div className="detail-label02" style={{
                    fontWeight: '600', color: '#555', whiteSpace: 'nowrap',
                    flexShrink: 0, fontSize: '13px', width: '100px',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    <FaUser style={{ color: '#667ea5', fontSize: '13px' }} />
                    <span>Password</span>
                    <span style={{ color: '#999', fontSize: '12px' }}>:</span>
                  </div>
                  <div className="detail-value02" style={{
                    fontWeight: '600', color: '#1a1a1a', whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis', flex: 1,
                    minWidth: 0, fontSize: '14px', display: 'flex',
                    alignItems: 'center', justifyContent: 'flex-end', gap: '6px'
                  }}>
                    <span style={{ display: 'block', letterSpacing: '2px', fontSize: '16px' }}>
                      {"•".repeat(8)}
                    </span>
                    <button className="copy-btn02" onClick={() => handleCopy(registeredUser.password, "Password")} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: copiedField === "Password" ? '#4CAF50' : '#667ea5',
                      fontSize: '15px', transition: 'all 0.3s ease',
                      padding: '4px 6px', flexShrink: 0, display: 'flex',
                      alignItems: 'center', borderRadius: '4px',
                    }}>
                      {copiedField === "Password" ? <FaCheck /> : <FaCopy />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-actions02" style={{
                display: 'flex', gap: '12px', justifyContent: 'center',
                alignItems: 'center', padding: '8px 0'
              }}>
                <button className="btn-dashboard02" onClick={handleGoToLogin} style={{
                  background: '#667eea', color: 'white', border: 'none',
                  borderRadius: '12px', fontSize: '15px', fontWeight: '700',
                  cursor: 'pointer', transition: 'all 0.3s ease',
                  width: '100%', boxShadow: '0 6px 20px  rgba(161, 138, 216, 0.35)',
                  letterSpacing: '1px', whiteSpace: 'nowrap', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}> GO TO LOGIN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Signup;