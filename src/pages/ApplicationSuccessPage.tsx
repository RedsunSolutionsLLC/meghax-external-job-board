import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Result, Button, Typography } from 'antd';
import { analyzeResumePublic, ResumeAnalysisResult } from '../api/jobs';
import ResumeMatcherResults, { ResumeMatcherLoading } from '../components/ResumeMatcherResults';

const { Paragraph } = Typography;

export default function ApplicationSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { jobTitle?: string; company?: string; uuid?: string; applicationUuid?: string } | null;

  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<ResumeAnalysisResult | null>(null);

  useEffect(() => {
    if (state?.uuid && state?.applicationUuid) {
      setAiAnalyzing(true);
      analyzeResumePublic(state.uuid, state.applicationUuid)
        .then((res) => {
          if (res?.data?.analysis) {
            setAiAnalysis(res.data.analysis);
          }
        })
        .catch((err) => {
          console.error('AI analysis error (candidate view):', err);
        })
        .finally(() => {
          setAiAnalyzing(false);
        });
    }
  }, [state?.uuid, state?.applicationUuid]);

  return (
    <div style={{ maxWidth: 1000, margin: '48px auto 64px' }}>
      <Result
        status="success"
        title="Application Submitted!"
        subTitle={
          state?.jobTitle
            ? `Your application for "${state.jobTitle}"${state.company ? ` at ${state.company}` : ''} has been received.`
            : 'Your application has been received successfully.'
        }
        extra={[
          <Button type="primary" key="register" onClick={() => navigate('/register')}>
            Register to Track Application
          </Button>,
          <Button key="home" onClick={() => navigate('/')}>
            Back to Home
          </Button>,
        ]}
      >
        <Paragraph style={{ textAlign: 'center' }}>
          We&apos;ve sent a confirmation email to your inbox with a link to register.
          Create an account to track your application status and browse more job opportunities.
        </Paragraph>
      </Result>

      <div style={{ marginTop: 24 }}>
        {aiAnalyzing && <ResumeMatcherLoading jobTitle={state?.jobTitle || 'the position'} />}
        {!aiAnalyzing && aiAnalysis && (
          <ResumeMatcherResults 
            analysis={aiAnalysis} 
            jobTitle={state?.jobTitle || 'the position'} 
          />
        )}
      </div>
    </div>
  );
}
