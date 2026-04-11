import { Component } from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Error no capturado por ErrorBoundary:', error, info.componentStack);
  }

  handleReload = () => {
    sessionStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content glass">
            <p className="error-boundary-icon">⚠️</p>
            <h2 className="error-boundary-title">Algo salió mal</h2>
            <p className="error-boundary-msg">
              Ocurrió un error inesperado. Puedes intentar recargar la página.
            </p>
            <button className="buy-button" onClick={this.handleReload}>
              Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
