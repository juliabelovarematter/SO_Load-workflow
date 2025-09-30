import formbricks from '@formbricks/js'

// Initialize Formbricks (call this once in your app)
export const initializeFormbricks = async () => {
  try {
    await formbricks.setup({
      environmentId: "cmfy9tv371mlnx801lfcjfy80", // your environment ID
      appUrl: "https://app.formbricks.com",
    })
    
    // Set user attributes
    await formbricks.setUserId("anonymous-user")
    await formbricks.setAttribute("source", "prototype")
    
    console.log('✅ Formbricks initialized successfully')
    return true
  } catch (error) {
    console.log('⚠️ Formbricks initialization failed:', error)
    return false
  }
}

// Trigger survey function
export const triggerSurvey = (surveyId: string, context?: Record<string, any>) => {
  try {
    console.log('Triggering survey:', surveyId)
    
    // Track the survey trigger event
    formbricks.track("survey-triggered", {
      surveyId,
      context: context || {},
      timestamp: new Date().toISOString()
    })
    
    console.log('✅ Survey trigger event sent successfully')
  } catch (error) {
    console.log('⚠️ Failed to trigger survey:', error)
  }
}

// Your survey ID
export const FEEDBACK_SURVEY_ID = "cmg5eady614awyt01kqe0i5q4"
