import React from 'react';

interface UserGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserGuide: React.FC<UserGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 rounded-t-2xl z-10">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">User Guide</h2>
          <button 
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            aria-label="Close user guide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="p-8 overflow-y-auto prose prose-slate dark:prose-invert max-w-none">
          <h3>1. Introduction: What is the Green Energy Analyzer?</h3>
          <p>Welcome to the Green Energy Candidate Analyzer! This powerful, AI-driven tool is designed to provide personalized analysis and strategic recommendations for adopting renewable energy solutions. Whether you're a homeowner curious about solar panels, a community leader planning a neighborhood project, a policymaker assessing regional potential, or a sales professional developing a market strategy, this analyzer provides the data-driven insights you need.</p>
          <p>The application guides you through a step-by-step process, tailored to your specific role, to deliver a customized report on your green energy potential.</p>

          <h3>2. Getting Started: Your First Steps</h3>
          <p>No matter your goal, every analysis begins with two key pieces of information:</p>
          <ul>
            <li><strong>Your Role:</strong> In Step 1, select the role that best describes you (Homeowner, Community Organizer, Policymaker, or Sales Professional).</li>
            <li><strong>Location:</strong> Provide the location you wish to analyze. For homeowners, a specific address is best. For other roles, a city, state, or region is sufficient.</li>
          </ul>

          <h3>3. Understanding the User Workflows</h3>
          
          <h4>A. For Homeowners, Community Organizers, and Policymakers</h4>
          <p>This workflow is designed to give you a comprehensive overview of your green energy options.</p>
          <ol>
            <li><strong>Step 2: Energy Audit & Priorities</strong> - Provide details about your property and energy consumption. The more information you provide, the more accurate the AI's analysis will be.</li>
            <li><strong>Step 3: AI Analysis</strong> - The AI performs a detailed analysis and presents its findings in a series of cards, each focusing on a different technology (e.g., Solar, Wind, Geothermal).</li>
            <li><strong>Step 4: Personalized Summary</strong> - The AI synthesizes all the information into a single, easy-to-read summary with an overall recommendation and actionable next steps.</li>
            <li><strong>Step 5: Technology Portfolio</strong> - Explore a curated catalog of real-world companies and technologies that can help you implement the recommended solutions.</li>
          </ol>

          <h4>B. For Sales Professionals / Consultants</h4>
          <p>This workflow is a unique, multi-step process that builds a complete sales and marketing playbook. The AI performs a new analysis at each step, using the previous results as context.</p>
          <ol>
            <li><strong>Step 2: Technology Selection</strong> - Select the green energy technology that you represent or are selling.</li>
            <li><strong>Step 3: Define Target Market</strong> - The AI delivers a Market Potential Analysis and a detailed Ideal Customer Profile (ICP).</li>
            <li><strong>Step 4: Identify Key Selling Points</strong> - Using the ICP, the AI crafts compelling marketing messages and sales hooks.</li>
            <li><strong>Step 5: Outline Outreach Strategy</strong> - The AI provides recommended lead generation channels and a competitor snapshot.</li>
            <li><strong>Step 6: Full Report</strong> - The AI compiles all previous analyses into a single, cohesive Sales & Marketing Playbook.</li>
          </ol>

          <h3>4. A Smarter AI: Understanding Search Grounding</h3>
          <p>To ensure your analysis is as current and relevant as possible, our AI uses a feature called <strong>search grounding</strong>.</p>
          <ul>
            <li><strong>What it is:</strong> The AI has the ability to use Google Search in real-time to find up-to-the-minute information that may not be in its base knowledge.</li>
            <li><strong>How it helps you:</strong> This is particularly powerful for finding location-specific data that changes frequently, such as the latest government grants, local tax incentives, and regional renewable energy policies.</li>
            <li><strong>Verifying the Information:</strong> We believe in transparency. At the bottom of any analysis that uses search grounding, you will find a <strong>"Sources Consulted"</strong> section. This lists the websites the AI visited, allowing you to click and verify the data for yourself.</li>
          </ul>
          
          <h3>5. Navigating the Analyzer</h3>
            <ul>
                <li>Use the <strong>"Next"</strong> and <strong>"Back"</strong> buttons to move through the steps.</li>
                <li>The "Next" button will remain disabled until you provide the required information for the current step. If the AI is performing an analysis, the button will show an "Analyzing..." state.</li>
                <li>Once you reach the final step of your workflow, you can use the <strong>"Start Over"</strong> button to reset the application and begin a new analysis.</li>
            </ul>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;
