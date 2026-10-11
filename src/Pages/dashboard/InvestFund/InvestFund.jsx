import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Wallet, History, ShieldCheck, ArrowRight, Zap, Headphones, BarChart3 } from 'lucide-react';
import apiClient from '../../../api/apiClient';
import { useUser } from '../../../context/UserContext';
import Toast from '../../../Componenets/ui/Toast';
import './Invest.css';

const InvestFund = () => {
  const { fetchData, userData } = useUser();
  const [bot1Amount, setBot1Amount] = useState('');
  const [loadingBot1, setLoadingBot1] = useState(false);

  // ✅ ROI calculator
  const getROI = (amount) => {
    const amt = Number(amount) || 0;
    if (amt >= 2500) return 16;
    if (amt >= 2000) return 14;
    if (amt >= 1500) return 12;
    if (amt >= 1000) return 10;
    if (amt >= 500) return 8;
    if (amt >= 50) return 6;
    return 0;
  };

  const regno = sessionStorage.getItem("Regno");

  const investInBot = async (botId, amount) => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }
    if (parseFloat(amount) < 50) {
      toast.error('Minimum investment is $50.');
      return;
    }

    setLoadingBot1(true);
    try {
      const response = await apiClient.post('/Dashboard/Investment', {
        regno: regno,
        rkprice: parseFloat(amount),
        uRegno: 0,
      });
      if (response.data.result === 'true') {
        toast.success(response.data.message);
        await fetchData();
        setBot1Amount('');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Something went wrong!');
    } finally {
      setLoadingBot1(false);
    }
  };

  // ✅ Investment Plans Data
  const investmentPlans = [
    { amount: '$50 – $499', roi: '6%' },
    { amount: '$500 – $999', roi: '8%' },
    { amount: '$1,000 – $1,499', roi: '10%' },
    { amount: '$1,500 – $1,999', roi: '12%' },
    { amount: '$2,000 – $2,499', roi: '14%' },
    { amount: '$2,500+', roi: '16%' },
  ];

  return (
    <div className="invest-container">
      <Toast />

      {/* Top Navigation Bar */}
      <div className="invest-header">
        <div className="header-left">
          <div className="logo-box">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4712/4712035.png"
              alt="bot"
            />
          </div>
          <div className="title-box">
            <h1>Invest <span>Bot</span></h1>
            <p>Smart bots. Better returns.</p>
          </div>
        </div>
        <div className="header-right">
          <div className="btn-primary gap-1">
            <Wallet size={20} className="wallet-icon me-1" style={{ color: "#fff" }} />
            <div className="deposit-info">
              <span className="value">${userData?.Depositfund?.toLocaleString() || 0}</span>
            </div>
          </div>

          <Link to="/dashboard/InvestmentHistory" className="btn-primary gap-1">
            <History size={18} />
            <span>History</span>
          </Link>
        </div>
      </div>

      {/* ✅ Main Row: Bot Card + Investment Plan Table — Side by Side */}
      <div className="invest-main-row">

        {/* Left: Bot Card */}
        <div className="bot-grid">
          <div className="bot-card purple-theme">
            <div className="card-header">
              <div className="bot-details">
                <h3>BOT</h3>
              </div>
              <div className="top-shield"><ShieldCheck size={18} /></div>
            </div>

            <div className="card-middle">
              <div className="bot-visual">
                <div className="bot-glow"></div>
                <img
                  src="https://i.pinimg.com/1200x/18/39/fe/1839fe826cbbda43160f5aa76031d9a3.jpg"
                  alt="bot1"
                />
              </div>

              <div className="profit-box">
                <p className="profit-label">Expected Monthly Profit</p>

                <div className="form-group03">
                  <label className="form-label mb-1">AMOUNT *</label>
                  <div className="amount-input-wrapper mb-3">
                    <span className="currency-sign">$</span>
                    <input
                      className="amount-input-field "
                      type="number"
                      placeholder="Enter Amount"
                      value={bot1Amount}
                      onChange={(e) => setBot1Amount(e.target.value)}
                    />
                  </div>

                  {bot1Amount && Number(bot1Amount) >= 50 && (
                    <div
                      style={{
                        marginBottom: '12px',
                        fontSize: '12px',
                        color: '#dda60d',
                        fontWeight: 600,
                        lineHeight: 1.4,
                      }}
                    >
                      You invest{' '}
                      <strong style={{ fontWeight: 900 }}>
                        ${Number(bot1Amount).toLocaleString()}
                      </strong>
                      , you will get{' '}
                      <strong style={{ fontWeight: 900, color: 'green' }}>
                        {getROI(bot1Amount)}% ROI
                      </strong>{' '}
                      monthly!
                    </div>
                  )}

                  <button
                    className="invest-now-btn col-12 col-md-6"
                    onClick={() => investInBot(1, bot1Amount)}
                    disabled={loadingBot1}
                  >
                   
                    {loadingBot1 ? 'PROCESSING...' : 'INVEST NOW'}
                    <div className="arrow-circle">
                      <ArrowRight size={16} />
                    </div>
                  </button>
                </div>

                <div className="info-row01 mt-2">
                  <p>
                    <span style={{ color: 'green' }}>Limit :</span> Minimum Investment{' '}
                    <span>$50</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Right: Investment Plan Table */}
        <div className="plan-table-wrapper">
          <div className="plan-table-header">
            <h3>Choose your investment plan and earn monthly returns.</h3>
          </div>
          <table className="plan-table">
            <thead>
              <tr>
                <th>Investment Amount</th>
                <th>Monthly ROI</th>
              </tr>
            </thead>
            <tbody>
              {investmentPlans.map((plan, index) => (
                <tr key={index}>
                  <td>{plan.amount}</td>
                  <td className="roi-cell">{plan.roi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Features Row */}
      <div className="features-row">
        <div className="f-item">
          <div className="f-icon purple"><ShieldCheck /></div>
          <div className="f-text"><h3>Secure & Safe</h3><p>Your investments are protected</p></div>
        </div>
        <div className="f-item">
          <div className="f-icon purple"><BarChart3 /></div>
          <div className="f-text"><h3>Weekly Profit</h3><p>Earn profit every week</p></div>
        </div>
        <div className="f-item">
          <div className="f-icon blue"><Zap /></div>
          <div className="f-text"><h3>Instant Start</h3><p>Get started in few clicks</p></div>
        </div>
        <div className="f-item">
          <div className="f-icon green"><Headphones /></div>
          <div className="f-text"><h3>24/7 Support</h3><p>We are here for you</p></div>
        </div>
      </div>
    </div>
  );
};

export default InvestFund;