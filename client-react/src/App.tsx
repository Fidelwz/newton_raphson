import { useState } from 'react'
import type { FormEvent } from 'react'
// Importa los estilos de CSS que quieras (puedes copiar tu styles.css a src/)
import './App.css' 
// Para las gráficas
import Plot from 'react-plotly.js';
// Para renderizar LaTeX
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

// --- 1. Definimos los TIPOS de datos que recibiremos de la API ---

interface IStep {
  iteration: number;
  x_n: number;
  f_x: number;
  df_x: number;
  next_x: number;
  error: number;
}

interface IPlotData {
  x_vals: number[];
  y_vals: (number | null)[]; // Puede tener nulos (nan)
  iteration_points: number[];
  iteration_y: number[];
}

interface IResultData {
  steps: IStep[];
  solution: number;
  iterations: number;
  plot_data: IPlotData;
  function_latex: string;
}

// --- 2. El Componente Principal ---

function App() {
  // Estados para el formulario
  const [functionStr, setFunctionStr] = useState('');
  const [x0, setX0] = useState('');
  const [epsilon, setEpsilon] = useState('');

  // Estados para manejar la respuesta de la API
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IResultData | null>(null);

  // --- 3. Función para manejar el envío del formulario ---
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // Evita que la página se recargue
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/calculate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json', // <--- ¡ESTO ES VITAL!
  },
  body: JSON.stringify({
    function: functionStr,
    x0: x0,
    epsilon: epsilon,
  }),
});

      const data = await response.json();

      if (!response.ok) {
        // Si la API devuelve un error (ej. 400, 500)
        throw new Error(data.error || 'Something went wrong');
      }

      // ¡Éxito! Guardamos los resultados
      setResult(data);

    } catch (err) {
      // err may be unknown; normalize
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    } finally {
      setLoading(false);
    }
  };

  // Función para el <select> de ejemplos
  const handleSampleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFunctionStr(e.target.value);
  };

  // --- 4. Renderizado (JSX) ---
  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-center text-primary">Newton-Raphson Method Calculator (React)</h1>

      {/* --- FORMULARIO --- */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="form-group">
          <label htmlFor="function"><strong>Enter function <InlineMath math="f(x)" />:</strong></label>
          <div className="d-flex">
            <input
              type="text"
              id="function"
              className="form-control"
              placeholder="e.g. x^2 - 4*x + 4"
              value={functionStr}
              onChange={(e) => setFunctionStr(e.target.value)}
              required
            />
            {/* El selector de tu index.html */}
            <select className="form-control ml-2" onChange={handleSampleChange}>
              <option value="">Sample functions</option>
              <option value="x^2 - 4*x + 4">x² - 4x + 4</option>
              <option value="x^3 - 6*x^2 + 11*x - 6">x³ - 6x² + 11x - 6</option>
              <option value="x^2 + sin(x)">x² + sin(x)</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="x0"><strong>Enter initial guess (<InlineMath math="x_0" />):</strong></label>
          <input
            type="text"
            id="x0"
            className="form-control"
            placeholder="e.g. 1"
            value={x0}
            onChange={(e) => setX0(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="epsilon"><strong>Enter epsilon (tolerance, optional):</strong></label>
          <input
            type="text"
            id="epsilon"
            className="form-control"
            placeholder="e.g. 0.001"
            value={epsilon}
            onChange={(e) => setEpsilon(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Calculating...' : 'Calculate'}
        </button>
      </form>

      {/* --- ZONA DE RESULTADOS (Renderizado Condicional) --- */}

      {/* 1. Muestra el spinner si está cargando */}
      {loading && (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}

      {/* 2. Muestra el error si existe */}
      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* 3. Muestra los resultados si existen */}
      {result && (
        <div id="results">
          <div className="alert alert-success text-center mt-4">
            <strong>Final solution:</strong> <span className="font-weight-bold">{result.solution.toFixed(8)}</span>
          </div>

          <h2 className="mt-4 text-center">Newton-Raphson Formula</h2>
          <BlockMath math="x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}" />

          {/* --- Tabla de Pasos --- */}
          <div className="table-responsive mt-4">
            <table className="table table-bordered table-hover">
              <thead className="thead-light">
                <tr>
                  <th>Iteration</th>
                  <th><InlineMath math="x_n" /></th>
                  <th><InlineMath math="f(x_n)" /></th>
                  <th><InlineMath math="f'(x_n)" /></th>
                  <th><InlineMath math="x_{n+1}" /></th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {result.steps.map((step) => (
                  <tr key={step.iteration}>
                    <td>{step.iteration}</td>
                    <td>{step.x_n.toFixed(6)}</td>
                    <td>{step.f_x.toFixed(6)}</td>
                    <td>{step.df_x.toFixed(6)}</td>
                    <td>{step.next_x.toFixed(6)}</td>
                    <td>{step.error.toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- Gráfica Plotly --- */}
          <h2 className="mt-4 text-center">
            Graph of the function: <InlineMath math={`f(x) = ${result.function_latex}`} />
          </h2>
          <Plot
            data={[
              // Trazo 1: La función f(x)
              {
                x: result.plot_data.x_vals,
                y: result.plot_data.y_vals,
                type: 'scatter',
                mode: 'lines',
                name: 'f(x)',
                line: { color: 'blue' }
              },
              // Trazo 2: Los puntos de iteración
              {
                x: result.plot_data.iteration_points,
                y: result.plot_data.iteration_y,
                type: 'scatter',
                mode: 'markers',
                name: 'Iterations',
                marker: { color: 'red', size: 10 }
              },
            ]}
            layout={{
              title: 'Graph of f(x) and Iterations',
              xaxis: { title: 'x' },
              yaxis: { title: 'f(x)' },
              autosize: true
            }}
            useResizeHandler={true}
            style={{ width: "100%", height: "450px" }}
          />
        </div>
      )}
    </div>
  )
}

export default App