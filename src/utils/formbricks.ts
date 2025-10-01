import formbricks from '@formbricks/js'

// Initialize Formbricks
export const initializeFormbricks = async () => {
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

// Trigger survey
export const triggerSurvey = async (surveyId: string) => {
  try {
    // Track the event
    await formbricks.track("so-give-feedback-clicked", { 
      hiddenFields: {
        surveyId: surveyId
      } 
    })
    console.log('✅ Survey trigger event sent successfully')
  } catch (error) {
    console.log('⚠️ Failed to trigger survey:', error)
  }
}

// Survey ID for SO Give Feedback
export const SO_FEEDBACK_SURVEY_ID = "cmg5eady614awyt01kqe0i5q4"
