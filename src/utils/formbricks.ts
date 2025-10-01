import formbricks from '@formbricks/js'

// Initialize Formbricks
export const initializeFormbricks = async () => {
  try {
    console.log('🔄 Initializing Formbricks...')
    console.log('Formbricks import:', formbricks)
    console.log('Formbricks type:', typeof formbricks)
    
    if (!formbricks) {
      throw new Error('Formbricks import is null/undefined')
    }
    
    await formbricks.setup({
      environmentId: "cmfy9tv371mlnx801lfcjfy80",
      appUrl: "https://app.formbricks.com",
    })
    console.log('✅ Formbricks initialized successfully')
    console.log('Formbricks instance:', formbricks)
  } catch (error) {
    console.log('⚠️ Formbricks initialization failed:', error)
  }
}

// Trigger survey
export const triggerSurvey = async (surveyId: string, cssSelector?: string) => {
  try {
    console.log('🔄 Triggering survey:', surveyId)
    console.log('CSS Selector:', cssSelector)
    console.log('Formbricks instance available:', !!formbricks)
    
    // Check if Formbricks is initialized
    if (!formbricks || !formbricks.track) {
      throw new Error('Formbricks not initialized or track method not available')
    }
    
    // Use provided CSS selector or default to SO button
    const selector = cssSelector || ".so-give-feedback-button"
    
    // Track the event with the action key that matches the dashboard
    await formbricks.track(selector, { 
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

// Reset user to see survey again
export const resetUserForSurvey = async () => {
  try {
    console.log('🔄 Resetting Formbricks user...')
    
    // Logout current user
    if (formbricks && formbricks.logout) {
      await formbricks.logout()
      console.log('✅ User logged out')
    }
    
    // Clear Formbricks storage
    const formbricksKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('formbricks') || key.startsWith('fb_')
    )
    formbricksKeys.forEach(key => {
      localStorage.removeItem(key)
    })
    
    // Clear session storage
    const sessionKeys = Object.keys(sessionStorage).filter(key => 
      key.startsWith('formbricks') || key.startsWith('fb_')
    )
    sessionKeys.forEach(key => {
      sessionStorage.removeItem(key)
    })
    
    console.log('✅ Formbricks user reset - survey will show again')
    
    // Reinitialize with new user
    await initializeFormbricks()
    
  } catch (error) {
    console.log('⚠️ Failed to reset user:', error)
  }
}
