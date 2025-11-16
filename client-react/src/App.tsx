import { useState } from 'react'
import type { FormEvent } from 'react'
// 1. Importar motion y AnimatePresence
import { motion, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'

// Importar los nuevos estilos
import './App.css' 
import Plot from 'react-plotly.js';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

// --- (Las interfaces IStep, IPlotData, IResultData no cambian) ---

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
  y_vals: (number | null)[];
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

// --- 2. Variantes de Animación ---

// Variante para el contenedor del título (anima a los hijos)
const titleContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03, // Cada letra aparece 0.03s después de la anterior
    },
  },
};

// Variante para cada letra del título
const titleLetterVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 12,
      stiffness: 200,
    },
  },
};

// Variante para las tarjetas (formulario y resultados)
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 15,
      stiffness: 100,
      duration: 0.5
    },
  },
  exit: {
    opacity: 0,
    y: -30,
    transition: {
      duration: 0.3
    }
  }
};


// --- 3. El Componente Principal ---
function App() {
  const [functionStr, setFunctionStr] = useState('');
  const [x0, setX0] = useState('');
  const [epsilon, setEpsilon] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IResultData | null>(null);

  // El texto del título para animar
  const titleText = "Calculadora Método de Newton-Raphson";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // (Esta lógica de fetch no cambia)
      const response = await fetch('https://newton-raphson-be716b48c201.herokuapp.com/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          function: functionStr,
          x0: x0,
          epsilon: epsilon,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      
      setResult(data);

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    } finally {
      setLoading(false);
    }
  };

  const handleSampleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFunctionStr(e.target.value);
  };

  // --- 4. Renderizado (JSX) con Animaciones ---
  return (
    <div className="app-container">
      
      {/* --- TÍTULO ANIMADO --- */}
      <motion.header 
        className="app-header"
        variants={titleContainerVariants}
        initial="hidden"
        animate="visible"
      >
        <h1 className="app-title">
          {titleText.split('').map((char, index) => (
            <motion.span key={index} variants={titleLetterVariants}>
              {char}
            </motion.span>
          ))}
        </h1>
      </motion.header>

      <main>
        {/* --- TARJETA DE FORMULARIO ANIMADA --- */}
        <motion.div
          className="glass-card"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <form onSubmit={handleSubmit} className="form-grid">
            
            <div className="form-group">
              <label htmlFor="function"><strong>Ingresa la función <InlineMath math="f(x)" />:</strong></label>
              <div className="input-group">
                <input
                  type="text"
                  id="function"
                  className="form-input"
                  placeholder="p.ej. x^2 - 4*x + 4"
                  value={functionStr}
                  onChange={(e) => setFunctionStr(e.target.value)}
                  required
                />
                <select className="form-select" onChange={handleSampleChange} value={functionStr}>
                  <option value="">Funciones de ejemplo</option>
                  <option value="x^2 - 4*x + 4">x² - 4x + 4</option>
                  <option value="x^3 - 6*x^2 + 11*x - 6">x³ - 6x² + 11x - 6</option>
                  <option value="x^2 + sin(x)">x² + sin(x)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="x0"><strong>Aproximación inicial (<InlineMath math="x_0" />):</strong></label>
              <input
                type="text"
                id="x0"
                className="form-input"
                placeholder="p.ej. 1"
                value={x0}
                onChange={(e) => setX0(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="epsilon"><strong>Epsilon (tolerancia, opcional):</strong></label>
              <input
                type="text"
                id="epsilon"
                className="form-input"
                placeholder="p.ej. 0.001"
                value={epsilon}
                onChange={(e) => setEpsilon(e.target.value)}
              />
            </div>
            
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading && <div className="spinner"></div>}
              {loading ? 'Calculando...' : 'Calcular'}
            </button>
          </form>
        </motion.div>

        {/* --- ZONA DE RESULTADOS ANIMADA --- */}
        {/* AnimatePresence permite animar la entrada y salida de componentes */}
        <AnimatePresence>
          
          {/* 1. Spinner de carga */}
          {loading && (
            <motion.div
              className="status-message"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              Cargando...
            </motion.div>
          )}

          {/* 2. Mensaje de Error */}
          {error && (
            <motion.div
              className="status-message error"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <strong>Error:</strong> {error}
            </motion.div>
          )}

          {/* 3. Tarjeta de Resultados */}
          {result && (
            <motion.div
              id="results"
              className="glass-card"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="status-message success">
                <strong>Solución final:</strong> {result.solution.toFixed(8)}
              </div>

              <h2 className="results-title">Fórmula de Newton-Raphson</h2>
              <BlockMath math="x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}" />

              <h2 className="results-title">Tabla de Iteraciones</h2>
              <div className="table-responsive">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Iteración</th>
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

              <h2 className="results-title">
                Gráfica: <InlineMath math={`f(x) = ${result.function_latex}`} />
              </h2>
              <Plot
                data={[
                  {
                    x: result.plot_data.x_vals,
                    y: result.plot_data.y_vals,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'f(x)',
                    line: { color: 'cyan' } // Color más brillante para el tema oscuro
                  },
                  {
                    x: result.plot_data.iteration_points,
                    y: result.plot_data.iteration_y,
                    type: 'scatter',
                    mode: 'markers',
                    name: 'Iteraciones',
                    marker: { color: '#F92672', size: 10 } // Un rosa/rojo vibrante
                  },
                ]}
                layout={{
                  // --- ESTILOS DE PLOTLY PARA TEMA OSCURO ---
                  paper_bgcolor: 'transparent',
                  plot_bgcolor: 'rgba(0, 0, 0, 0.2)',
                  font: { color: '#e0e0e0' },
                  title: {
                    text: 'Gráfica de f(x) e iteraciones',
                    font: { color: '#ffffff' }
                  },
                  xaxis: { 
                    title: 'x', 
                    gridcolor: 'rgba(255, 255, 255, 0.1)'
                  },
                  yaxis: { 
                    title: 'f(x)', 
                    gridcolor: 'rgba(255, 255, 255, 0.1)'
                  },
                  legend: {
                    font: { color: '#e0e0e0' }
                  },
                  autosize: true
                }}
                useResizeHandler={true}
                style={{ width: "100%", height: "450px" }}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  )
}

export default App