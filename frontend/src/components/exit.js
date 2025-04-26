import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

const ProctoringExitPage = () => {
  const navigate = useNavigate();
  const { uuid } = useParams(); // Get test UUID from the URL

  const handleRetake = () => navigate(`/smartbridge/online-test-assessment/${uuid}/cover`);
  const handleHome = () => navigate("/dashboard");
  return (
    <>
      <style>
        {`
          .exit-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          }

          .exit-card {
            background: white;
            border-radius: 1.5rem;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
            padding: 5.5rem;
            max-width: 520px;
            width: 100%;
            text-align: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .exit-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.12);
          }

          .alert-circle {
            width: 80px;
            height: 80px;
            background: #fef2f2;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
          }

          .alert-icon {
            color: #ef4444;
            width: 40px;
            height: 40px;
          }

          .exit-title {
            font-size: 2rem;
            font-weight: 700;
            color: #111827;
            margin-bottom: 0.75rem;
            line-height: 1.3;
          }

          .exit-message {
           font-size: 1.2rem;
            color: #4b5563;
            margin-bottom: 2rem;
            line-height: 1.6;
          }

          .button-group {
            display: flex;
            flex-direction: column;
            gap: 0.55rem;
            width: 100%;
          }

          @media (min-width: 480px) {
            .button-group {
              flex-direction: row;
              justify-content: center;
            }
          }

          .exit-button {
            padding: 0.75rem 1.5rem;
            border-radius: 0.75rem;
            font-weight: 600;
            font-size: 1.05rem;
            transition: all 0.2s ease;
            cursor: pointer;
            flex: 1;
            max-width: 180px;
            margin: 0 auto;
          }

          .primary-btn {
            background: #3b82f6;
            color: white;
            border: none;
          }

          .primary-btn:hover {
            background: #2563eb;
            transform: translateY(-1px);
          }

          .secondary-btn {
            background: white;
            color: #374151;
            border: 2px solid #e5e7eb;
          }

          .secondary-btn:hover {
            background: #f9fafb;
            border-color: #d1d5db;
          }
        `}
      </style>

      <div className="exit-container">
        <div className="exit-card">
          <div className="alert-circle">
            <AlertTriangle className="alert-icon" />
          </div>
          
          <h1 className="exit-title">Test Session Ended</h1>
          
          <p className="exit-message">
            Proctoring detected rule violations. Your test was exited to maintain integrity.
            <br />
            You may retake if permitted.
          </p>
          
          <div className="button-group">
            <button 
              onClick={handleRetake}
              className="exit-button primary-btn"
            >
              Retake Test
            </button>
            <button 
              onClick={handleHome}
              className="exit-button secondary-btn"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProctoringExitPage;