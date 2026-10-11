import { useEffect, useState } from 'react';
import { FaCreditCard } from "react-icons/fa6";

import { GiProfit } from "react-icons/gi";
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    LineElement,
    PointElement,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Link } from 'react-router-dom';
// import toast from 'react-hot-toast';
import { toast } from 'react-toastify';
import apiClient from '../../api/apiClient';
import Marquee from './Marquee';
// import Toast from '../../Componenets/ui/Toast';


ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    LineElement,
    PointElement,
    Tooltip,
    Legend,
    Filler
);

const Dashboard = () => {
    const navigate = useNavigate();
    const { userData, refreshData } = useUser();
    //  Add this state at the top with other states
    const [hoveredIncome, setHoveredIncome] = useState(null);


    // Withdraw Modal States -  FIXED
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [payoutAmount, setPayoutAmount] = useState('');
    const [minimumWithdraw] = useState(10);
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [apiBotStatus, setApiBotStatus] = useState();
    const [countdown, setCountdown] = useState("");
    const displayBalance = userData?.WorkingWallet || 0;



    const loginId = sessionStorage.getItem("loginId");
    const regno = sessionStorage.getItem('Regno');

    // ============ SIRF RIGHT SIDE UPDATE - CHART STABLE ============
    const [isBotStarting, setIsBotStarting] = useState(false);

    // ✅ FRESH PRICE FETCH - Same as BotTrading
    const fetchFreshPrice = async (binanceSymbol) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        try {
            const response = await fetch(
                `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`,
                { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`Binance ${response.status}`);
            const data = await response.json();
            const price = parseFloat(data.price);
            if (!price || isNaN(price) || price <= 0) throw new Error("Invalid price");
            return price;
        } catch (err) {
            clearTimeout(timeoutId);
            console.error("❌ Fresh price fetch failed:", err);
            return null;
        }
    };

    // ✅ Dashboard Start Bot - Same as BotTrading
    const handleDashboardStartBot = async () => {
        if (apiBotStatus === 0) {
            toast.warning('Bot is already running!');
            return;
        }

        // ✅ Fallback 100 - agar Invest 0 ho toh bhi chalega
        const investAmount = parseFloat(userData?.Invest) || 100;

        // ✅ RANDOM CURRENCY
        const currencies = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'];
        const randomCurrency = currencies[Math.floor(Math.random() * currencies.length)];
        const defaultSlot = 24;

        // ✅ DIRECT MAPPING
        const binanceSymbols = {
            'BTC': 'BTCUSDT',
            'ETH': 'ETHUSDT',
            'BNB': 'BNBUSDT',
            'SOL': 'SOLUSDT',
            'XRP': 'XRPUSDT'
        };

        const binanceSymbol = binanceSymbols[randomCurrency];

        setIsBotStarting(true);

        // ✅ FRESH PRICE FETCH (properly declared)
        const livePrice = await fetchFreshPrice(binanceSymbol);

        if (livePrice === null) {
            toast.error("Live price fetch nahi ho paya. Internet check karo aur dobara try karo.");
            setIsBotStarting(false);
            return;
        }

        console.log(`💰 Live ${randomCurrency} price:`, livePrice);

        // ✅ PAYLOAD
        const payload = {
            regno: parseInt(regno),
            betAmount: investAmount,
            currency: randomCurrency.toLowerCase(),
            currencyRate: livePrice,   // ✅ EXACT live price
            slot: defaultSlot
        };

        try {
            const response = await apiClient.post('/Trading/BotTrading', payload);

            if (response.data?.result === "true") {
                toast.success(`Bot started for ${defaultSlot} hrs with ${randomCurrency} @ $${livePrice}`);
                await refreshData();
                await fetchBotStatus();
                setApiBotStatus(0);
            } else {
                toast.error(response.data?.message || "Bot start failed");
            }
        } catch (error) {
            console.error(' Error:', error);
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Something went wrong"
            );
        } finally {
            setIsBotStarting(false);
        }
    };

    // BOT start in Dashboard direct
    const fetchBotStatus = async () => {
        try {
            setLoading(true);
            const regno = sessionStorage.getItem('Regno');


            const response = await apiClient.get(`/Trading/BotStatus?regno=${regno}`);


            if (response.data?.result === "true") {
                const status = response.data?.response?.status;
                await refreshData();
                setApiBotStatus(status);
                return status;
            }
            setApiBotStatus(1);
            return 1;
        } catch (error) {
            console.error(" Error fetching bot status:", error);
            setApiBotStatus(1);
            return 1;
        } finally {
            setLoading(false);
        }
    };

    //  2. FETCH STATUS ON MOUNT
    useEffect(() => {
        fetchBotStatus();
    }, []);

    //  3. COUNTDOWN TIMER - Only when status = 0 (Running)

    useEffect(() => {
        const targetTime = new Date(
            userData.status.replace(" ", "T") + "+04:00"
        ).getTime();

        const timer = setInterval(() => {
            const diff = targetTime - Date.now();

            if (diff <= 0) {
                setCountdown("00H : 00M : 00S");
                clearInterval(timer);
                //  Auto refresh status when timer expires
                fetchBotStatus();
                return;
            }

            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            setCountdown(
                `${String(hours).padStart(2, "0")}H : ${String(minutes).padStart(2, "0")}M : ${String(seconds).padStart(2, "0")}S`
            );
        }, 1000);

        return () => {
            clearInterval(timer);
        };
    }, [userData?.status, apiBotStatus]);


    // Send OTP - SIRF API KA MESSAGE
    const handleSendOTP = async () => {
        try {
            setLoading(true);
            setOtpVerified(false);

            const url = `/Auth/genrate-otp?loginid=${loginId}&regno=${regno}`;
            const response = await apiClient.post(url);
            // SIRF API KA MESSAGE DIKHAO
            if (response.data.result === "true") {
                toast.success(response.data.message);
                setOtpSent(true);
            } else {
                toast.error(response.data.message || 'Failed to send OTP');
            }
        } catch (error) {
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    // Verify OTP - SIRF API KA MESSAGE
    const handleVerifyOTP = async () => {
        try {
            setLoading(true);

            const response = await apiClient.post('/Auth/verify-otp', null, {
                params: {
                    loginid: loginId,
                    regno: regno,
                    otp: otp
                }
            });
            // CHECK KARO - result string hai ya boolean
            const isSuccess = response.data?.result === "true" || response.data?.result === true;

            if (isSuccess) {
                // SUCCESS - API ka exact message
                const successMsg = response.data?.message || 'OTP verified successfully!';
                toast.success(successMsg);
                setOtpVerified(true);
                setOtpSent(true);
            } else {
                //  FAILURE - API ka exact message
                const errorMsg = response.data?.message || 'Invalid OTP. Please try again.';
                toast.error(errorMsg);
                setOtp('');
            }
        } catch (error) {
            console.error(" API Error:", error);
            console.error(" Error Response:", error.response);

            // Error response se message nikaalo
            let errorMsg = 'Network error. Please try again.';
            if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            } else if (error.response?.data?.Message) {
                errorMsg = error.response.data.Message;
            }
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Dashboard.js
    const goToStatement = (type) => {
        const encodedType = encodeURIComponent(type);
        navigate(`/dashboard/IncomeReport?type=${encodedType}`);
    };

    // const goToHistory = (type) => {
    //     const encodedType = encodeURIComponent(type);
    //     navigate(`/dashboard/TokenMiningIncomeHistory?type=${encodedType}`);
    // };



    // ✅ Income Payout
    const handleWithdraw = async () => {
        const amountNum = parseFloat(withdrawAmount);

        // Validations
        if (!withdrawAmount || isNaN(amountNum) || amountNum <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        if (amountNum < minimumWithdraw) {
            Swal.fire({
                icon: 'warning',
                title: 'Minimum Withdrawal $10!',
                text: `You entered $${withdrawAmount}. Minimum withdrawal amount is $10.`,
                confirmButtonColor: '#667eea',
                confirmButtonText: 'OK, Got it!',
                backdrop: 'rgba(0,0,0,0.6)',
                zIndex: 9999999,
            });
            return;
        }
        if (amountNum > displayBalance) {
            Swal.fire({
                icon: 'error',
                title: 'Insufficient Balance!',
                text: `Available balance is $${displayBalance.toFixed(2)}. Please enter a valid amount.`,
                confirmButtonColor: '#d33',
                confirmButtonText: 'OK',
                backdrop: 'rgba(0,0,0,0.6)',
                zIndex: 9999999,
            });
            return;
        }

        setWithdrawLoading(true);
        try {
            const payload = {
                regNo: parseInt(regno),
                amount: amountNum,
                payMode: "usdt"
            };

            const response = await apiClient.post('/IncomePayout/WithdrawRequest', payload);

            if (response.data?.result === "true") {
                // ✅ SUCCESS - SweetAlert
                Swal.fire({
                    icon: 'success',
                    title: '✅ Withdrawal Successful!',
                    text: response.data?.message || 'Withdrawal request submitted successfully!',
                    confirmButtonColor: '#28a745',
                    confirmButtonText: 'OK',
                    timer: 3000,
                    timerProgressBar: true,
                    backdrop: 'rgba(0,0,0,0.6)',
                    zIndex: 9999999,
                });

                // ✅ Close modal and reset
                setShowWithdrawModal(false);
                setWithdrawAmount('');
                setOtp('');
                setOtpSent(false);
                setOtpVerified(false);
                await refreshData();

            } else {
                // FAILURE - API ka exact message
                const errorMsg = response.data?.message || 'Withdrawal failed';
                Swal.fire({
                    icon: 'error',
                    title: 'Withdrawal Failed!',
                    text: errorMsg,
                    confirmButtonColor: '#d33',
                    confirmButtonText: 'OK',
                    backdrop: 'rgba(0,0,0,0.6)',
                    zIndex: 9999999,
                });
            }
        } catch (error) {
            console.error('Withdrawal error:', error);

            let errorMsg = 'Server error. Please try again.';
            if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMsg = error.response.data.error;
            } else if (error.message) {
                errorMsg = error.message;
            }

            Swal.fire({
                icon: 'error',
                title: 'Server Error!',
                text: errorMsg,
                confirmButtonColor: '#d33',
                confirmButtonText: 'Try Again',
                backdrop: 'rgba(0,0,0,0.6)',
                zIndex: 9999999,
            });
        } finally {
            setWithdrawLoading(false);
        }
    };

    const handlePayoutClick = () => {
        const amountNum = parseFloat(payoutAmount);

        //  Check if amount is valid
        if (!payoutAmount || isNaN(amountNum) || amountNum <= 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Invalid Amount!',
                text: 'Please enter a valid amount.',
                confirmButtonColor: '#667eea',
                confirmButtonText: 'OK',
            });
            return;
        }

        //  Check minimum amount
        if (amountNum < 10) {
            Swal.fire({
                icon: 'warning',
                title: 'Minimum Withdrawal $10!',
                text: `You entered $${payoutAmount}. Minimum withdrawal amount is $10.`,
                confirmButtonColor: '#667eea',
                confirmButtonText: 'OK, Got it!',
            });
            return;
        }

        //  Check balance
        const availableBalance = Number(userData?.WorkingWallet) || 0;
        if (amountNum > availableBalance) {
            Swal.fire({
                icon: 'error',
                title: ' Insufficient Balance!',
                text: `Available balance is $${availableBalance.toFixed(2)}. You entered $${amountNum.toFixed(2)}.`,
                confirmButtonColor: '#d33',
                confirmButtonText: 'OK',
            });
            return;
        }

        //  Sab sahi hai to modal open karo
        setWithdrawAmount(payoutAmount);
        setShowWithdrawModal(true);
    };
    // const resetWithdrawModal = () => {
    //     setWithdrawAmount("");
    //     setOtp("");
    //     setOtpSent(false);
    //     setOtpVerified(false);
    //     setLoading(false);
    //     setWithdrawLoading(false);
    // };


    return (
        <>
            {/* <Toast /> */}
            <div className="container-fluid">
                <div
                    className="card01 mb-2"
                    style={{
                        borderRadius: "8px",
                        border: "1px solid #f1f1f1",
                        overflow: "hidden",
                    }}
                >
                    <Marquee />
                </div>

                {/* whatsapp contact */}
                {/* <div className="whatsapp-float">
           
                    <div className="bubble-ring ring-1"></div>
                    <div className="bubble-ring ring-2"></div>
                    <div className="bubble-ring ring-3"></div>
                    <a
                        href="https://wa.me/447400402001"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="whatsapp-btn"
                        aria-label="Chat on WhatsApp"
                    >
                        <FaWhatsapp />
                    </a>
                </div> */}
                <div className="row">
                    {/* Welcome Card */}
                    <div className="col-12 col-lg-8 d-flex align-items-stretch">
                        <div className="card w-100 bg-primary-subtle overflow-hidden shadow-none">
                            <div className="card-body02 position-relative">
                                <div className="row">
                                    <div className="col-12 col-sm-7">
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <div className="d-flex">
                                                <div className="rounded-circle overflow-hidden me-6 flex-shrink-0">
                                                    <img
                                                        src="https://bootstrapdemos.adminmart.com/modernize/dist/assets/images/profile/user-1.jpg"
                                                        alt="profile"
                                                        width="40"
                                                        height="40"
                                                    />
                                                </div>
                                                <h5 className="fw-semibold mt-0 mt-md-2 fs-5 fs-sm-3">
                                                    Welcome back <span style={{ color: "green" }}>{userData?.loginid}</span>
                                                </h5>
                                            </div>
                                            <button
                                                className="invite-btn btn d-block d-sm-none"
                                                style={{
                                                    backgroundColor: Number(userData?.kid) > 0 ? "#04832f" : "#dc3545",
                                                    color: "#fff",
                                                    border: "none",
                                                    padding: "6px 16px",
                                                    borderRadius: "6px",
                                                    fontSize: "13px",
                                                    fontWeight: "500",
                                                }}
                                            >
                                                {Number(userData?.kid) > 0 ? "Active" : "Inactive"}
                                            </button>
                                        </div>

                                        <div className='mt-4'>
                                            <div className="row g-2">
                                                <div className="col-4">
                                                    <div className="card01 border-0 shadow-sm">
                                                        <Link to='/dashboard/DepositHistory' className="text-decoration-none">
                                                            <div className="card-body01 p-2 text-center">
                                                                <p className="income-text  mb-1 small" style={{ color: "#989595" }}>Deposit Fund</p>
                                                                <h6 className="income-balance mb-0 fw-bold text-dark">
                                                                    ${userData?.Depositfund || "0.00"}
                                                                </h6>
                                                            </div>
                                                        </Link>
                                                    </div>
                                                </div>

                                                <div className="col-4">
                                                    <div className="card01 border-0 shadow-sm">
                                                        <Link to='/dashboard/InvestmentHistory' className="text-decoration-none">
                                                            <div className="card-body01 p-2 text-center">
                                                                <p className="income-text  mb-1 small" style={{ color: "#989595" }}>Investment</p>
                                                                <h6 className="income-balance mb-0 fw-bold text-dark">
                                                                    ${userData?.Invest?.toFixed(2) || '0.00'}
                                                                </h6>
                                                            </div>
                                                        </Link>
                                                    </div>
                                                </div>

                                                <div className="col-4">
                                                    <div className="card01 border-0 shadow-sm">
                                                        <Link to='/dashboard/IncomeReport' className="text-decoration-none">
                                                            <div className="card-body01 p-2 text-center">
                                                                <p className="income-text  mb-1 small" style={{ color: "#989595" }}>Total Income</p>
                                                                <h6 className="income-balance mb-0 fw-bold">
                                                                    ${userData?.TotalIncome?.toFixed(2) || '0.00'}
                                                                </h6>
                                                            </div>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Remaining Days Countdown Timer */}
                                            <div className="row g-2 mt-1">
                                                <div className="col-6">
                                                    <div className="countdown-box text-center p-1">
                                                        <div className="small fw-semibold">
                                                            {apiBotStatus === 0 && ("BOT EXPIRE")}
                                                            {/* BOT EXPIRE */}
                                                        </div>

                                                        {/* ✅ Loading State - Same Size Maintain */}
                                                        {loading ? (
                                                            <div className="left-timer">
                                                                <span
                                                                    className="spinner-border"
                                                                    role="status"
                                                                    style={{
                                                                        width: '38px',
                                                                        height: '38px',
                                                                        borderWidth: '4px'
                                                                    }}
                                                                />
                                                            </div>
                                                        ) : apiBotStatus === 0 ? (
                                                            /* ✅ Timer */
                                                            <div className="left-timer fw-bold">
                                                                {countdown || "00H : 00M : 00S"}
                                                            </div>
                                                        ) : (
                                                            /* ✅ Start Button */
                                                            <button
                                                                className="btn btn-sm btn-primary"
                                                                onClick={handleDashboardStartBot}  // ✅ Sahi hai
                                                                disabled={isBotStarting}
                                                            >
                                                                {isBotStarting ? 'Starting...' : 'Start Bot'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="countdown-box text-center p-1">
                                                        <div className="small fw-semibold ">
                                                            RANK
                                                        </div>
                                                        <div className="left-timer">
                                                            {userData?.Ranks || "N/A"}
                                                        </div>
                                                    </div>
                                                </div>


                                                {/* <div className="col-6">
                                                    <div className="countdown-box text-center p-1">
                                                        <div className="small fw-semibold ">
                                                            BOT-1
                                                        </div>
                                                        <div className="left-timer">
                                                            {currentEarnings || "00"} / 2.5%
                                                        </div>
                                                    </div>
                                                </div> */}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-12 col-sm-5 mt-4 mt-sm-0">
                                        <div className="welcome-bg-img text-center text-sm-end position-relative">
                                            <button
                                                className="btn d-none d-sm-inline-block position-absolute"
                                                style={{
                                                    backgroundColor: Number(userData?.kid) > 0 ? "#04832f" : "#dc3545",
                                                    color: "white",
                                                    border: "none",
                                                    padding: "8px 24px",
                                                    borderRadius: "6px",
                                                    fontSize: "14px",
                                                    fontWeight: "500",
                                                    top: "-5px",
                                                    right: "0",
                                                    zIndex: 1,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        color: "#ffffff",
                                                        textShadow: "0 0 5px rgba(179, 62, 62, 0.8)",
                                                        fontWeight: "700",
                                                    }}
                                                >
                                                    {Number(userData?.kid) > 0 ? "Active" : "Inactive"}
                                                </span>
                                            </button>
                                            <img
                                                src="https://bootstrapdemos.adminmart.com/modernize/dist/assets/images/backgrounds/welcome-bg.svg"
                                                alt="welcome"
                                                className="img-fluid"
                                                style={{ maxWidth: "100%", height: "auto", marginTop: "5px" }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Income Wallet - Fully Responsive */}
                    <div className="col-md-6 col-lg-4 d-flex align-items-stretch">
                        <div className="card w-100">
                            <div className="card-body p-3">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <h5 className="fw-bold mb-0" style={{ fontSize: "clamp(16px, 2vw, 20px)" }}>
                                        Income Wallet
                                    </h5>
                                </div>

                                <div className="row g-2">
                                    {/* Left - Chart */}
                                    <div className="col-5 col-sm-5 col-md-6">
                                        <div style={{
                                            height: "clamp(100px, 15vw, 130px)",
                                            position: "relative",
                                            width: "100%"
                                        }}>
                                            {(() => {
                                                const categories = [
                                                    { label: "Bot Income", value: Number(userData?.AIBOTIncome) || 0, color: "#5D87FF", hoverColor: "#2B5BD9" },
                                                    // { label: "Trading Level Bonus", value: Number(userData?.TradingLevelIncome) || 0, color: "#28a745", hoverColor: "#1A7A32" },
                                                    // { label: "Sponsor Bonus", value: Number(userData?.SponsorIncome) || 0, color: "#FFB74D", hoverColor: "#E67E22" },
                                                    // { label: "Salary", value: Number(userData?.Salary) || 0, color: "#FF6B6B", hoverColor: "#C0392B" },
                                                    // { label: "Reward", value: Number(userData?.Reward) || 0, color: "#9C27B0", hoverColor: "#6A1B9A" }
                                                ];

                                                const filteredCategories = categories.filter(c => c.value > 0);

                                                //  Agar koi income nahi hai toh empty chart dikhao
                                                if (filteredCategories.length === 0) {
                                                    return (
                                                        <>
                                                            <Doughnut
                                                                data={{
                                                                    labels: ["No Income"],
                                                                    datasets: [{
                                                                        data: [100],
                                                                        backgroundColor: ["#E0E0E0"],
                                                                        borderWidth: 0,
                                                                        cutout: "75%"
                                                                    }]
                                                                }}
                                                                options={{
                                                                    responsive: true,
                                                                    maintainAspectRatio: false,
                                                                    plugins: {
                                                                        legend: { display: false },
                                                                        tooltip: { enabled: false }
                                                                    }
                                                                }}
                                                            />
                                                            <div style={{
                                                                position: "absolute",
                                                                top: "50%",
                                                                left: "50%",
                                                                transform: "translate(-50%, -50%)",
                                                                textAlign: "center",
                                                                pointerEvents: 'none',
                                                                zIndex: 1
                                                            }}>
                                                                <h6 className="fw-bold mb-0" style={{
                                                                    fontSize: "clamp(11px, 1.2vw, 14px)",
                                                                    color: "#999"
                                                                }}>
                                                                    $0.00
                                                                </h6>
                                                                <small className="" style={{ fontSize: "clamp(7px, 0.8vw, 9px)" }}>
                                                                    No Income
                                                                </small>
                                                            </div>
                                                        </>
                                                    );
                                                }

                                                const getColors = () => {
                                                    return filteredCategories.map(c => {
                                                        if (hoveredIncome && hoveredIncome.label === c.label) {
                                                            return c.hoverColor || c.color;
                                                        }
                                                        if (hoveredIncome) {
                                                            return c.color + '40';
                                                        }
                                                        return c.color;
                                                    });
                                                };

                                                return (
                                                    <>
                                                        <Doughnut
                                                            data={{
                                                                labels: filteredCategories.map(c => c.label),
                                                                datasets: [{
                                                                    data: filteredCategories.map(c => c.value),
                                                                    backgroundColor: getColors(),
                                                                    borderColor: hoveredIncome ? '#ffffff' : 'transparent',
                                                                    borderWidth: hoveredIncome ? 2 : 0,
                                                                    cutout: "75%"
                                                                }]
                                                            }}
                                                            options={{
                                                                responsive: true,
                                                                maintainAspectRatio: false,
                                                                plugins: {
                                                                    legend: { display: false },
                                                                    tooltip: {
                                                                        backgroundColor: "rgba(0,0,0,0.85)",
                                                                        titleColor: "#ffffff",
                                                                        bodyColor: "#ffffff",
                                                                        padding: 10,
                                                                        cornerRadius: 6,
                                                                        titleFont: { size: 12, weight: 'bold' },
                                                                        bodyFont: { size: 11 },
                                                                        callbacks: {
                                                                            label: function (context) {
                                                                                const value = context.parsed || 0;
                                                                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                                                                return `💰 $${value.toFixed(2)} (${percentage}%)`;
                                                                            },
                                                                            title: function (context) {
                                                                                return context[0].label;
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        <div style={{
                                                            position: "absolute",
                                                            top: "50%",
                                                            left: "50%",
                                                            transform: "translate(-50%, -50%)",
                                                            textAlign: "center",
                                                            pointerEvents: 'none',
                                                            zIndex: 1
                                                        }}>
                                                            <h6 className="fw-bold mb-0" style={{
                                                                fontSize: "clamp(11px, 1.2vw, 14px)",
                                                                color: "#5A6A85"
                                                            }}>
                                                                ${Number(userData?.TotalIncome || 0).toFixed(2)}
                                                            </h6>
                                                            <small className="" style={{ fontSize: "clamp(7px, 0.8vw, 9px)" }}>
                                                                Total Income
                                                            </small>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {/* Right - Income List */}
                                    <div className="col-7 col-sm-7 col-md-6 mt-5">
                                        <div className="d-flex flex-column gap-1">
                                            {(() => {
                                                const categories = [
                                                    { label: "Bot Income", value: Number(userData?.AIBOTIncome) || 0, color: "#5D87FF" },
                                                    // { label: "Trading Level Bonus", value: Number(userData?.TradingLevelIncome) || 0, color: "#28a745" },
                                                    // { label: "Sponsor Bonus", value: Number(userData?.SponsorIncome) || 0, color: "#FFB74D" },
                                                    // { label: "Salary", value: Number(userData?.Salary) || 0, color: "#FF6B6B" },
                                                    // { label: "Reward", value: Number(userData?.Reward) || 0, color: "#9C27B0" }
                                                ];

                                                return categories.map((cat, index) => {
                                                    const isHovered = hoveredIncome && hoveredIncome.label === cat.label;
                                                    const hasValue = cat.value > 0;

                                                    return (
                                                        <div
                                                            key={index}
                                                            className="d-flex align-items-center justify-content-between"
                                                            style={{
                                                                padding: "2px 6px",
                                                                borderRadius: "4px",
                                                                background: isHovered ? cat.color + '25' : 'transparent',
                                                                border: isHovered ? `2px solid ${cat.color}` : '1px solid transparent',
                                                                cursor: hasValue ? 'pointer' : 'default',
                                                                transition: 'all 0.3s ease',
                                                                opacity: hoveredIncome && !isHovered ? 0.4 : 1,
                                                                pointerEvents: hasValue ? 'auto' : 'none'
                                                            }}
                                                            onMouseEnter={() => {
                                                                if (hasValue) setHoveredIncome(cat);
                                                            }}
                                                            onMouseLeave={() => {
                                                                setHoveredIncome(null);
                                                            }}
                                                        >
                                                            <div className="d-flex align-items-center gap-1">
                                                                <span style={{
                                                                    width: "clamp(6px, 0.8vw, 10px)",
                                                                    height: "clamp(6px, 0.8vw, 10px)",
                                                                    borderRadius: "2px",
                                                                    backgroundColor: cat.color,
                                                                    display: "inline-block",
                                                                    opacity: hasValue ? 1 : 0.3,
                                                                    transition: 'all 0.3s ease',
                                                                    transform: isHovered ? 'scale(1.3)' : 'scale(1)'
                                                                }}></span>
                                                                <span style={{
                                                                    fontSize: "clamp(8px, 0.9vw, 11px)",
                                                                    color: isHovered ? cat.color : (hasValue ? '#555' : '#bbb'),
                                                                    fontWeight: isHovered ? '700' : (hasValue ? '500' : '400'),
                                                                    whiteSpace: 'nowrap',
                                                                    transition: 'all 0.3s ease'
                                                                }}>
                                                                    {cat.label}
                                                                </span>
                                                            </div>
                                                            <span style={{
                                                                fontSize: "clamp(8px, 0.9vw, 11px)",
                                                                fontWeight: isHovered ? '700' : '600',
                                                                color: isHovered ? cat.color : (hasValue ? '#333' : '#bbb'),
                                                                transition: 'all 0.3s ease'
                                                            }}>
                                                                ${cat.value.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>




                <div className=' row'>
                    <div className="col-12 col-lg-3">
                        <div className="row g-2">

                            {/* Card 1 - BOT INCOME */}
                            {/* <div className="col-6 col-lg-4 d-flex align-items-stretch"> */}
                            <div>
                                <div className="card01 w-100 border-0 shadow-sm" style={{ cursor: "pointer" }} onClick={() => goToStatement("AI Bot Income")}>
                                    <div className="card-body02 bonus-card p-3" style={{ height: "112px" }}>
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <p className="incometext mb-1">Bot Income</p>
                                                <div className="amount-report">
                                                    ${userData?.AIBOTIncome?.toLocaleString() || '0.00'}
                                                </div>
                                            </div>
                                            <div className="p-2 bg-primary-subtle rounded-2">
                                                <i class="ti ti-bot-id"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2 - Trading Level Bonus */}
                            {/* <div className="col-6 col-lg-4 d-flex align-items-stretch">
                                <div className="card01 w-100 border-0 shadow-sm" style={{ cursor: "pointer" }} onClick={() => goToStatement("Trading Level Bonus")}>
                                    <div className="card-body02 bonus-card01 p-3">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <p className="incometext mb-1">Trading Level Bonus</p>
                                                <h5 className="fw-bold mb-0 amount-report">
                                                    ${userData?.TradingLevelIncome?.toLocaleString() || '0.00'}
                                                </h5>
                                            </div>
                                            <div className="p-2 bg-success-subtle rounded-2">
                                                <i class="ti ti-brand-vinted"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div> */}

                            {/* Card 3 - Direct Income */}
                            {/* <div className="col-12 col-lg-4 col-md-12 d-flex align-items-stretch">
                                <div className="card01 w-100 border-0 shadow-sm" style={{ cursor: "pointer" }} onClick={() => goToStatement("Sponsor Bonus")}>
                                    <div className="card-body02 bonus-card p-3">
                                        <div className="d-flex  justify-content-between align-items-start mb-2">
                                            <div>
                                                <p className="incometext mb-1">Sponsor Bonus</p>
                                                <h5 className="fw-bold mb-0 amount-report">
                                                    ${userData?.SponsorIncome?.toLocaleString() || '0.00'}
                                                </h5>
                                            </div>
                                            <div className="p-2 bg-info-subtle rounded-2">
                                                <i class="ti ti-fidget-spinner"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div> */}

                        </div>

                        {/* Row 2 - 3 Cards (Salary, Reward, APEX Mining) */}
                        <div className="row g-2 mt-1">

                            {/* Card 4 - Salary */}
                            {/* <div className="col-6 col-lg-4 d-flex align-items-stretch">
                                <div className="card01 w-100 border-0 shadow-sm" style={{ cursor: "pointer" }} onClick={() => goToStatement("Salary")}>
                                    <div className="card-body02 bonus-card01 p-3">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div className="text-decoration-none w-100">
                                                <div>
                                                    <p className="incometext mb-1">Salary</p>
                                                    <h5 className="fw-bold mb-0 amount-report">
                                                        ${userData?.Salary?.toLocaleString() || '0.00'}
                                                    </h5>
                                                </div>
                                            </div>
                                            <div className="p-2 bg-warning-subtle rounded-2">
                                                <i class="ti ti-moneybag"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div> */}

                            {/* Card 5 - Reward */}
                            {/* <div className="col-6 col-lg-4 d-flex align-items-stretch">
                                <div className="card01 w-100 border-0 shadow-sm" style={{ cursor: "pointer" }} onClick={() => goToStatement("Reward")}>
                                    <div className="card-body02 bonus-card p-3">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <p className="incometext mb-1">Reward</p>
                                                <h5 className="fw-bold mb-0 amount-report">
                                                    ${userData?.Reward?.toLocaleString() || '0.00'}
                                                </h5>
                                            </div>
                                            <div className="p-2 bg-primary-subtle rounded-2">
                                                <i className="ti ti-crown fs-5 text-warning"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div> */}

                            {/* Card 6 - Payoutable */}
                            {/* <div className="col-12 col-lg-4 col-md-12 d-flex align-items-stretch mb-2 mb-lg-0"> */}
                            <div>
                                <div className="card01 w-100 border-0 shadow-sm mb-5" style={{ cursor: "pointer" }}  >
                                    <div className="card-body02 bonus-card01 p-3" style={{ height: "110px" }}>
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <p className="incometext mb-1">Payoutable</p>
                                                <h5 className="fw-bold mb-0 amount-report">
                                                    ${userData?.WorkingWallet?.toLocaleString() || '0.00'}
                                                </h5>
                                            </div>
                                            <div className="p-2 bg-warning-subtle rounded-2">
                                                <i class="ti ti-building-bank"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="col-12 col-lg-4 d-flex align-items-stretch">
                        <div className="card w-100 border-0 shadow-sm">
                            <div className="card-body02 p-3">
                                <h5 className="card-title fw-semibold mb-3" style={{ color: "#000", fontSize: "20px" }}>Team/Business Details</h5>

                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="p-1 bg-primary-subtle rounded-2">
                                            <i className="ti ti-user fs-5 text-primary"></i>
                                        </div>
                                        <h6 className="teamtext mb-0 fw-semibold">Total Team</h6>
                                    </div>
                                    <h6 className="mb-0 fw-semibold incometext01">{userData?.TeamCount || '0'}</h6>
                                </div>

                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="p-1" >
                                            <i className="ti ti-chart-line" style={{ color: '#1976D2' }}></i>
                                        </div>
                                        <h6 className="teamtext mb-0 fw-semibold">Active Team</h6>
                                    </div>
                                    <h6 className="mb-0 fw-semibold incometext01">{userData?.ActiveTeam || '0'}</h6>
                                </div>

                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="p-1">
                                            <i className="ti ti-arrows-exchange fs-5" style={{ color: '#1976D2' }}></i>
                                        </div>
                                        <h6 className="teamtext mb-0 fw-semibold">Inactive Team</h6>
                                    </div>
                                    <h6 className="mb-0 fw-semibold incometext01">{userData?.InactiveTeam || '0'}</h6>
                                </div>

                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="p-1" >
                                            <i className="ti ti-repeat fs-5" style={{ color: '#1976D2' }}></i>
                                        </div>
                                        <h6 className="teamtext mb-0 fw-semibold">Active Direct</h6>
                                    </div>
                                    <h6 className="mb-0 fw-semibold incometext01">{userData?.directId || '0'}</h6>
                                </div>

                                {/* <div className="d-flex align-items-center justify-content-between mb-2">
                                            <div className="d-flex align-items-center gap-2">                                    
                                                <h6 className="teamtext mb-0 fw-semibold">Level Open</h6>
                                            </div>
                                            <h6 className="mb-0 fw-semibold">{userData?.OpenLevel || '0'}</h6>
                                        </div> */}

                            </div>
                        </div>
                    </div>
                    {/* payout and income Section */}
                    <div className="col-12 col-lg-5 d-flex align-items-stretch">
                        <div className="card w-100 border-0">
                            <div className="d-flex justify-content-between p-2 mt-2 px-3">
                                <div style={{ fontWeight: "900", fontSize: "20px" }}>Income Payout</div>
                                <div className='mint-box'><GiProfit /></div>
                            </div>
                            <div className="c-box">
                                <div className="payout-input-box p-3">
                                    <input
                                        type="number"
                                        className="custom-pay-form form-control mb-2"
                                        placeholder='Enter Amount'
                                        value={payoutAmount}
                                        onChange={(e) => setPayoutAmount(e.target.value)}
                                        style={{ padding: "10px", fontWeight: "800", color: "green" }}
                                    />
                                    <div className="d-flex align-items-center justify-content-between mt-4">
                                        <Link to="/dashboard/IncomePayOutHistory">
                                            <h5 className='amount-report'>
                                                ${userData?.WorkingWallet?.toLocaleString() || '0.00'}
                                            </h5>
                                            <p className="mb-2" style={{ color: '#3c3a3a' }}>
                                                Payout Amount
                                            </p>
                                        </Link>
                                        <button
                                            type="button"
                                            className="custtom-button"
                                            onClick={handlePayoutClick}
                                        >
                                            PayOut
                                        </button>
                                    </div>
                                    <div className='d-flex align-items-center gap-2'>
                                        <span style={{ color: "green", fontWeight: "bold" }}>Note :</span>
                                        <p style={{ margin: 0, color: "#666", fontSize: "13px" }}>Min Withdrawal $10</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>


            {/* ✅ Withdraw Modal - Without Success State */}
            {showWithdrawModal && (
                <div className="modal-overlay">
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h4>Income Payout</h4>
                            <button
                                className="modal-close"
                                onClick={() => {
                                    setShowWithdrawModal(false);
                                    setWithdrawAmount('');
                                    setOtp('');
                                    setOtpSent(false);
                                    setOtpVerified(false);
                                    setLoading(false);
                                    setWithdrawLoading(false);
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* Balance Info */}
                            <div className="balance-info">
                                <h6>Available balance</h6>
                                <strong>${displayBalance?.toLocaleString() || '0.00'}</strong>
                            </div>

                            <div className='meddle'>
                                <div className="methods-grid mt-3">
                                    <div className="method-chip active">
                                        <FaCreditCard />
                                        <span>Wallet Address</span>
                                    </div>
                                </div>

                                <div className="saved-details-box mt-3">
                                    <div className="details-content">
                                        <div className="detail-row">
                                            <span className="detail-value" style={{
                                                wordBreak: 'break-all',
                                                fontSize: '13px',
                                                color: '#495057'
                                            }}>
                                                {userData.walletid || 'No wallet address found'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Amount Input */}
                                <div className="amount-area mb-3 mt-3">
                                    <div className="amount-label">Enter Amount</div>
                                    <div className="amount-input-wrapper">
                                        <span className="currency-symbol">$</span>
                                        <input
                                            type="number"
                                            className="amount-input"
                                            placeholder="Enter amount"
                                            value={withdrawAmount}
                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                            disabled={withdrawLoading}
                                        />
                                    </div>
                                </div>

                                {/* OTP Section */}
                                <div className="amount-area mb-3 mt-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="amount-input-wrapper w-100">
                                            <input
                                                type="number"
                                                className="amount-input"
                                                placeholder="Enter OTP"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                disabled={!otpSent}
                                            />
                                        </div>

                                        {!otpSent ? (
                                            <button
                                                className="btn-primary py-2 px-4 text-nowrap"
                                                onClick={handleSendOTP}
                                                disabled={loading}
                                            >
                                                {loading ? "Sending..." : "Send OTP"}
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-success py-2 px-4 text-nowrap"
                                                onClick={handleVerifyOTP}
                                                disabled={loading || otp.length < 6}
                                            >
                                                {loading ? "Verifying..." : "Verify OTP"}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    className="modal-button mt-3"
                                    onClick={handleWithdraw}
                                    disabled={withdrawLoading || !otpVerified}
                                    style={{
                                        opacity: (withdrawLoading || !otpVerified) ? 0.6 : 1,
                                        cursor: (withdrawLoading || !otpVerified) ? 'not-allowed' : 'pointer',
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: (withdrawLoading || !otpVerified) ? '#6c757d' : '#667eea',
                                        color: 'white',
                                        fontWeight: '600',
                                        fontSize: '15px'
                                    }}
                                >
                                    {withdrawLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Processing...
                                        </>
                                    ) : !otpVerified ? (
                                        "Withdraw (Verify OTP First)"
                                    ) : (
                                        "Withdraw"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </>

    );
};

export default Dashboard;