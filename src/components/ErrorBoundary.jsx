import { Component } from 'react';
import { trackError } from '../utils/analytics';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, showDetails: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        trackError(error, errorInfo);
        console.error('[ErrorBoundary] Caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            const err = this.state.error;
            return (
                <div className="flex min-h-screen items-center justify-center bg-background p-4">
                    <div className="max-w-md text-center">
                        <div className="mb-8">
                            <svg
                                className="mx-auto h-24 w-24 text-red-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <h1 className="mb-4 text-2xl font-bold text-foreground">
                            Oops! Something went wrong
                        </h1>
                        <p className="mb-6 text-muted-foreground">
                            We're sorry for the inconvenience. Please try refreshing.
                        </p>

                        {err && (
                            <div className="mb-4">
                                <button
                                    onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
                                    className="text-xs text-muted-foreground underline mb-2 inline-block"
                                >
                                    {this.state.showDetails ? 'Hide details' : 'Show error details'}
                                </button>
                                {this.state.showDetails && (
                                    <pre className="text-xs text-left bg-red-50 dark:bg-red-950/30 p-3 rounded-lg overflow-auto max-h-40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                                        {err.message || err.toString()}
                                        {err.stack && `\n\n${err.stack.split('\n').slice(1, 4).join('\n')}...`}
                                    </pre>
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
