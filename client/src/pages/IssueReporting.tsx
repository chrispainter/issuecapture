import React from 'react';
import { Card } from '@/components/ui/card';
import StepperProgress from '@/components/StepperProgress';
import IssueForm from '@/components/IssueForm';

const IssueReporting: React.FC = () => {
  return (
    <div className="font-sans text-[#172B4D] bg-[#FAFBFC] min-h-screen">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">CNH FIRST</h1>
              <p className="text-neutral-500 mt-1 font-semibold">Field Issue Reporting Service Tool</p>
              <p className="text-neutral-500 mt-1">Document your issue comprehensively for automatic Jira ticket creation</p>
            </div>
            <div className="hidden md:flex items-center">
              {/* Company logo would go here */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 452 120"
                width="120"
                height="32"
                className="h-10"
              >
                <path
                  d="M49.87 19.94c-16.7 0-30.24 13.53-30.24 30.24 0 16.7 13.54 30.24 30.24 30.24s30.24-13.54 30.24-30.24c0-16.71-13.54-30.24-30.24-30.24zm0 51.81c-11.92 0-21.57-9.65-21.57-21.57s9.65-21.57 21.57-21.57 21.57 9.65 21.57 21.57-9.65 21.57-21.57 21.57z"
                  fill="#0052CC"
                />
                <path
                  d="M153.85 51.45l-27.3-41.45h-10.54l33.58 50.95v28.31h8.54V60.95L191.69 10h-10.54l-27.3 41.45z"
                  fill="#0052CC"
                />
                <path
                  d="M114.25 10h-8.53v69.26h8.53V10zM212.73 39.28c0-8.76 6.34-15.52 14.8-15.52 8.46 0 14.8 6.76 14.8 15.52v40.03h8.54V39.12c0-12.92-9.5-22.49-23.34-22.49-13.83 0-23.33 9.5-23.33 22.39v40.29h8.53V39.28z"
                  fill="#0052CC"
                />
                <path
                  d="M272.12 96.26l7.86-3.35c-8.42-19.7-8.42-40.88 0-60.58l-7.86-3.35c-9.9 21.68-9.9 45.6 0 67.28zM300.39 32.33L292.53 35.6c8.42 19.7 8.42 40.88 0 60.58l7.86 3.35c9.9-21.68 9.9-45.6 0-67.2z"
                  fill="#0052CC"
                />
              </svg>
            </div>
          </div>
        </header>

        {/* Main form area */}
        <main>
          <IssueForm />
        </main>
      </div>
    </div>
  );
};

export default IssueReporting;
