// Example script to test HR data and candidate info storage in the database
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_SERVICE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Example analysis result ID to update (replace with actual ID)
const analysisResultId = '00000000-0000-0000-0000-000000000000';

// Sample HR data to store
const hrData = {
  hrAnalysis: {
    overall: "Good candidate with solid qualifications. Worth considering for interview.",
    technical: "Strong technical profile with key skills: junior, TypeScript, Java.",
    cultural: "Cultural fit should be carefully assessed during interview process.",
    experience: "Limited relevant experience for this role."
  },
  hrAssessment: {
    status: "qualified",
    rating: 4,
    strengths: [
      "Strong technical skill set matching job requirements",
      "Impressive achievements with quantifiable results",
      "Strong educational background relevant to the position"
    ],
    weaknesses: [
      "Limited relevant work experience for this role"
    ]
  },
  hrRecommendations: [
    "Proceed to interview stage to evaluate candidate further",
    "Verify depth of experience in key areas during interview"
  ]
};

// Sample candidate information to store
const candidateInfo = {
  name: "John Smith",
  email: "john.smith@example.com",
  phone: "+1 (555) 123-4567",
  location: "San Francisco, CA",
  skills: ["JavaScript", "TypeScript", "React", "Node.js", "SQL", "Git"],
  experience: [
    {
      title: "Junior Frontend Developer",
      company: "TechStart Solutions",
      period: "2021-2023",
      description: "Developed responsive web applications using React and TypeScript"
    },
    {
      title: "Web Development Intern",
      company: "InnovateTech",
      period: "2020-2021",
      description: "Assisted in building and maintaining company websites"
    }
  ],
  education: [
    {
      degree: "Bachelor of Science in Computer Science",
      institution: "University of California, Berkeley",
      year: "2020"
    }
  ]
};

// Function to update the analysis result with HR data and candidate info
async function updateAnalysisResult() {
  try {
    const { data, error } = await supabase
      .from('analysis_results')
      .update({
        hr_data: hrData,
        candidate_info: candidateInfo
      })
      .eq('id', analysisResultId);
      
    if (error) {
      console.error('Error updating analysis result:', error);
      return;
    }
    
    console.log('Successfully updated analysis result with HR data and candidate info');
  } catch (err) {
    console.error('Exception caught:', err);
  }
}

// Run the update function
updateAnalysisResult(); 