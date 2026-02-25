type ErrorBannerProps = {
  message: string;
  requestId?: string;
};

export function ErrorBanner({ message, requestId }: ErrorBannerProps) {
  return (
    <div className="error" role="alert">
      <strong>Error:</strong> {message}
      {requestId ? <div>request_id: {requestId}</div> : null}
    </div>
  );
}
