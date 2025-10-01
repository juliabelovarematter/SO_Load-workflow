import React, { useEffect } from 'react'
import formbricks from '@formbricks/js'

export default function FeedbackButton() {
  useEffect(() => {
    // Initialize Formbricks
    const initializeFormbricks = async () => {
      try {
        await formbricks.setup({
          environmentId: "cmfy9tv371mlnx801lfcjfy80",
          appUrl: "https://app.formbricks.com",
        })
        console.log('✅ Formbricks initialized successfully')
      } catch (error) {
        console.log('⚠️ Formbricks initialization failed:', error)
      }
    }
    
    initializeFormbricks()
  }, [])

  const handleFeedbackClick = async () => {
    try {
      // Replace "SURVEY_ID" with your actual survey ID
      // For now, we'll use a simple event trigger
      await formbricks.track("feedback-button-clicked", { hiddenFields: {} })
      console.log('✅ Feedback event tracked')
    } catch (error) {
      console.log('⚠️ Failed to track feedback event:', error)
    }
  }

  return (
    <button
      onClick={handleFeedbackClick}
      style={{
        padding: "8px 16px",
        borderRadius: "6px",
        background: "#3b82f6",
        color: "white",
        border: "none",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "500",
        transition: "background-color 0.2s"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#2563eb"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#3b82f6"
      }}
    >
      Give Feedback
    </button>
  )
}
