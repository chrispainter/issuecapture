import React from 'react';
import { useLocation, useRoute, Link } from "wouter";
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const SubmissionSuccess: React.FC = () => {
  const [, params] = useRoute("/success/:ticketId");
  const ticketId = params?.ticketId || 'Unknown';

  return (
    <div className="font-sans text-[#172B4D] bg-[#FAFBFC] min-h-screen flex items-center justify-center">
      <div className="w-full max-w-xl p-4 md:p-6">
        <Card className="border-[#36B37E] border-t-4">
          <CardContent className="p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                <CheckCircle className="h-10 w-10 text-[#36B37E]" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold mb-4">Issue report submitted successfully!</h1>
                <p className="mb-6">
                  Your Jira ticket <strong>#{ticketId}</strong> has been created. You'll receive a confirmation email shortly.
                </p>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Your issue has been documented and sent to our technical team. They will analyze the information provided
                    and work on resolving the issue as soon as possible.
                  </p>
                  <p className="text-sm text-gray-600">
                    You can track the progress of your issue by referencing the ticket number in any follow-up communications.
                  </p>
                  <div className="pt-4">
                    <Link to="/">
                      <Button className="bg-[#36B37E] hover:bg-[#2b9069]">
                        Create Another Report
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubmissionSuccess;
