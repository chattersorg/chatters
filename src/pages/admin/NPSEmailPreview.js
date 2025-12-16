import React from 'react';

const NPSEmailPreview = () => {
  // Sample data - edit these values to preview different content
  const venueName = "The Rose & Crown";
  const logo = "https://jtuwqpzwxkvrwqnhqdjc.supabase.co/storage/v1/object/public/venue-logos/logos/lwm-logo.png";
  const primaryColor = "#4E74FF";
  const emailGreeting = `Thank you for visiting!`;
  const emailBody = "We hope you had a great experience. Your feedback helps us improve and serve you better.";
  const npsQuestion = "How likely are you to recommend us to a friend or colleague?";
  const emailButtonText = "Share Your Feedback";
  const npsUrl = "#";

  return (
    <div style={{
      backgroundColor: '#f3f4f6',
      minHeight: '100vh',
      margin: 0,
      padding: '20px 10px',
      fontFamily: "Arial, Helvetica, sans-serif"
    }}>
      {/* Email Container */}
      <table cellPadding="0" cellSpacing="0" style={{
        maxWidth: '600px',
        width: '100%',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '8px'
      }}>
        <tbody>
          {/* Header */}
          <tr>
            <td style={{
              padding: '24px 20px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <table cellPadding="0" cellSpacing="0" style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '50px', verticalAlign: 'middle' }}>
                      <img
                        src={logo}
                        alt={venueName}
                        style={{
                          height: '40px',
                          width: 'auto',
                          display: 'block'
                        }}
                      />
                    </td>
                    <td style={{
                      verticalAlign: 'middle',
                      textAlign: 'right',
                      fontSize: '18px',
                      fontWeight: 600,
                      color: '#111827'
                    }}>
                      {venueName}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* Main Content */}
          <tr>
            <td style={{ padding: '32px 20px' }}>
              <h1 style={{
                color: '#111827',
                fontSize: '22px',
                fontWeight: 700,
                marginTop: 0,
                marginBottom: '12px',
                lineHeight: 1.3
              }}>
                {emailGreeting}
              </h1>

              <p style={{
                fontSize: '15px',
                color: '#4b5563',
                lineHeight: 1.6,
                marginTop: 0,
                marginBottom: '28px'
              }}>
                {emailBody}
              </p>

              {/* Question */}
              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '28px'
              }}>
                <p style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#1f2937',
                  margin: 0,
                  lineHeight: 1.4
                }}>
                  {npsQuestion}
                </p>
              </div>

              {/* CTA Button */}
              <table cellPadding="0" cellSpacing="0" style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <td style={{ textAlign: 'center', paddingBottom: '16px' }}>
                      <a
                        href={npsUrl}
                        style={{
                          display: 'inline-block',
                          backgroundColor: primaryColor,
                          color: '#ffffff',
                          padding: '14px 32px',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontWeight: 600,
                          fontSize: '15px'
                        }}
                      >
                        {emailButtonText}
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>

              <p style={{
                fontSize: '13px',
                color: '#9ca3af',
                textAlign: 'center',
                margin: 0
              }}>
                Takes less than 30 seconds
              </p>
            </td>
          </tr>

          {/* Footer */}
          <tr>
            <td style={{
              backgroundColor: '#f9fafb',
              padding: '20px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <p style={{
                textAlign: 'center',
                fontSize: '12px',
                color: '#9ca3af',
                margin: 0,
                lineHeight: 1.6
              }}>
                You're receiving this because you recently visited {venueName}.<br />
                <a href={npsUrl} style={{ color: '#6b7280', textDecoration: 'underline' }}>Click here to respond</a> or ignore this email.
              </p>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Powered by footer */}
      <p style={{
        textAlign: 'center',
        marginTop: '20px',
        fontSize: '11px',
        color: '#9ca3af'
      }}>
        Powered by Chatters
      </p>
    </div>
  );
};

export default NPSEmailPreview;
