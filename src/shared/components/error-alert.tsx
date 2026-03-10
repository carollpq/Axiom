const ERROR_STYLE = {
  background: 'rgba(212,100,90,0.15)',
  color: '#d4645a',
  border: '1px solid rgba(212,100,90,0.3)',
} as const;

interface ErrorAlertProps {
  message: string;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div className="rounded-md px-4 py-3 text-[13px]" style={ERROR_STYLE}>
      {message}
    </div>
  );
}
