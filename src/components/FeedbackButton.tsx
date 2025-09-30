import { useEffect } from 'react'
import { initializeFormbricks, triggerSurvey, FEEDBACK_SURVEY_ID } from '../utils/formbricks'

export default function FeedbackButton() {
  useEffect(() => {
    initializeFormbricks()
  }, [])

  const handleFeedbackClick = () => {
    console.log('Feedback button clicked')
    triggerSurvey(FEEDBACK_SURVEY_ID, {
      source: 'header-button',
      page: 'bookings'
    })
  }

  return (
    <button
      style={{
        padding: "8px 16px",
        borderRadius: "6px",
        background: "#2563eb",
        color: "white",
        border: "none",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "500"
      }}
      onClick={handleFeedbackClick}
    >
      Give Feedback
    </button>
  );
}
