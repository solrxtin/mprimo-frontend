import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const BASE_URL = "http://localhost:5800/api/v1";
const jar = new CookieJar();

const axiosInstance = wrapper(axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  jar
}));

// Test vendor data
const testVendor = {
  businessName: "Test Vendor Inc",
  businessEmail: "vendor@example.com",
  password: "VendorPass123!",
  country: "United States",
  street: "123 Test St",
  city: "San Francisco",
  state: "California",
  postalCode: "94107",
};

const verificationData = {
  businessType: "business", // or "business"
  companyName: "Test Vendor Inc",
  country: "US",
  state: "CA",
  city: "San Francisco",
  postalCode: "94107",
  line1: "123 Test St",
  line2: "",
  phone: "4155551234",
  email: "vendor@example.com",
  dob: "1990-01-01",
};

async function registerVendor() {
  try {
    console.log('📝 Registering test vendor...');
    await axiosInstance.post('/auth/register-vendor', testVendor);
    console.log('✅ Vendor registered successfully');
    return true;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      console.log('ℹ️ Vendor already exists, proceeding to login');
      return true;
    }
    console.error('❌ Registration failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function loginVendor() {
  try {
    console.log('🔐 Logging in vendor...');
    await axiosInstance.post('/auth/login', {
      email: testVendor.email,
      password: testVendor.password
    });
    console.log('✅ Vendor login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testInitiateStripeVerification() {
  try {
    console.log('\n🏦 Testing Stripe verification initiation...');
    const response = await axiosInstance.post('/vendor-verification/stripe/initiate', verificationData);
    
    console.log('✅ Stripe verification initiated successfully');
    console.log(`   Account ID: ${response.data.accountId}`);
    console.log(`   Onboarding URL: ${response.data.onboardingUrl}`);
    
    return {
      success: true,
      accountId: response.data.accountId,
      onboardingUrl: response.data.onboardingUrl
    };
  } catch (error) {
    console.error('❌ Stripe verification initiation failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return { success: false };
  }
}

async function testCheckVerificationStatus() {
  try {
    console.log('\n📊 Testing verification status check...');
    const response = await axiosInstance.get('/vendor-verification/stripe/status');
    
    console.log('✅ Verification status retrieved successfully');
    console.log(`   Is Verified: ${response.data.isVerified}`);
    console.log(`   Requires Action: ${response.data.requiresAction}`);
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Currently Due: ${response.data.requirements.currently_due.length} items`);
    
    if (response.data.requirements.currently_due.length > 0) {
      console.log('   Required fields:', response.data.requirements.currently_due);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Status check failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function testGetVerificationRequirements() {
  try {
    console.log('\n📋 Testing verification requirements retrieval...');
    const response = await axiosInstance.get('/vendor-verification/stripe/requirements');
    
    console.log('✅ Verification requirements retrieved successfully');
    console.log(`   Country: ${response.data.country}`);
    console.log(`   Business Type: ${response.data.business_type}`);
    console.log(`   Details Submitted: ${response.data.details_submitted}`);
    console.log(`   Charges Enabled: ${response.data.charges_enabled}`);
    console.log(`   Payouts Enabled: ${response.data.payouts_enabled}`);
    
    const requirements = response.data.requirements;
    console.log(`   Currently Due: ${requirements.currently_due.length} items`);
    console.log(`   Eventually Due: ${requirements.eventually_due.length} items`);
    console.log(`   Past Due: ${requirements.past_due.length} items`);
    
    if (requirements.currently_due.length > 0) {
      console.log('   Currently Due Fields:', requirements.currently_due);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Requirements retrieval failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function runVendorVerificationTests() {
  console.log('🚀 Starting Vendor Verification Tests...\n');
  
  // Step 1: Register vendor
  const registerSuccess = await registerVendor();
  if (!registerSuccess) {
    console.log('\n❌ Tests failed - Could not register vendor');
    return;
  }
  
  // Step 2: Login vendor
  const loginSuccess = await loginVendor();
  if (!loginSuccess) {
    console.log('\n❌ Tests failed - Could not login vendor');
    return;
  }
  
  // Step 3: Initiate Stripe verification
  const initiateResult = await testInitiateStripeVerification();
  
  // Step 4: Check verification status
  const statusSuccess = await testCheckVerificationStatus();
  
  // Step 5: Get verification requirements
  const requirementsSuccess = await testGetVerificationRequirements();
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log(`   Register Vendor: ${registerSuccess ? '✅' : '❌'}`);
  console.log(`   Login Vendor: ${loginSuccess ? '✅' : '❌'}`);
  console.log(`   Initiate Stripe Verification: ${initiateResult.success ? '✅' : '❌'}`);
  console.log(`   Check Status: ${statusSuccess ? '✅' : '❌'}`);
  console.log(`   Get Requirements: ${requirementsSuccess ? '✅' : '❌'}`);
  
  const allPassed = registerSuccess && loginSuccess && initiateResult.success && statusSuccess && requirementsSuccess;
  console.log(`\n${allPassed ? '🎉 All tests passed!' : '⚠️ Some tests failed'}`);
  
  if (initiateResult.success && initiateResult.onboardingUrl) {
    console.log('\n🔗 Next Steps:');
    console.log('1. Visit the onboarding URL to complete Stripe verification:');
    console.log(`   ${initiateResult.onboardingUrl}`);
    console.log('2. After completing onboarding, run the status check again to see updated verification status');
  }
}

// Run the tests
runVendorVerificationTests().catch(console.error);