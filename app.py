from flask import Flask, request, jsonify # Importar jsonify
from flask_cors import CORS, cross_origin # Importar CORS
from flask.helpers import send_from_directory
import sympy as sp
import numpy as np
# Ya no necesitamos render_template, ni Decimal
# from decimal import Decimal, InvalidOperation 

# Import additional parsing tools
from sympy.parsing.sympy_parser import (
    parse_expr,
    standard_transformations,
    implicit_multiplication_application,
    convert_xor
)

app = Flask(__name__, static_folder='client-react/dist', static_url_path='')
# Habilitar CORS para todas las rutas, permitiendo el origen de tu app React
CORS(app) 
# Ajusta el puerto (5173) si tu app de React corre en otro.

# ... [Tu diccionario allowed_locals no cambia] ...
allowed_locals = {
    'ln': sp.log, 'log': sp.log, 'log10': lambda arg: sp.log(arg, 10),
    'sin': sp.sin, 'cos': sp.cos, 'tan': sp.tan, 'sec': lambda x: 1/sp.cos(x),
    'cosec': lambda x: 1/sp.sin(x), 'cot': lambda x: 1/sp.tan(x),
    'sqrt': sp.sqrt, 'exp': sp.exp, 'abs': sp.Abs, 'pi': sp.pi, 'E': sp.E
}
transformations = standard_transformations + (implicit_multiplication_application, convert_xor)

# ... [Tu función newton_raphson no cambia] ...
# Esta función ya devuelve los datos en un formato perfecto (lista de dicts)
def newton_raphson(f, df, x0, epsilon=0.001, max_iterations=100):
    """Performs the Newton-Raphson method to find a root of f(x)."""
    steps = []
    current_x = float(x0)

    for iteration in range(max_iterations):
        current_f = float(f(current_x))
        current_df = float(df(current_x))

        if abs(current_df) < 1e-8:
            return None, f"La derivada es demasiado pequeña en x = {current_x:.6f}. El método puede no converger."

        next_x = current_x - (current_f / current_df)
        error_val = abs(next_x - current_x)

        steps.append({
            "iteration": iteration,
            "x_n": current_x,
            "f_x": current_f,
            "df_x": current_df,
            "next_x": next_x,
            "error": error_val,
            # (Opcional) La fórmula en React la podemos construir allí
            # "formula": f"xₙ₊₁ = {current_x:.6f} - ({current_f:.6f})/({current_df:.6f}) = {next_x:.6f}"
        })

        if abs(current_f) < epsilon:
            return steps, None

        current_x = next_x

    return None, "El método de Newton-Raphson no convergió tras 100 iteraciones. Intente otra aproximación inicial."


# Esta es nuestra NUEVA ruta de API. Ya no usamos "/"
@app.route("/api/calculate", methods=["POST"])
def calculate():
    # 1. Obtener datos de la solicitud JSON de React
    data = request.json
    function_str = data.get("function", "").strip()
    
    # ... [Tu lógica de limpieza de function_str es la misma] ...
    function_str = function_str.replace("−", "-").replace("X", "x").lower()

    if not function_str:
        # 2. Devolver errores como JSON con un código de estado 400
        return jsonify({"error": "El campo de la función no puede estar vacío."}), 400

    try:
        x = sp.symbols('x')
        f_expr = parse_expr(function_str, local_dict=allowed_locals, transformations=transformations)
    except (SyntaxError, ValueError, TypeError) as e:
        return jsonify({"error": f"Expresión de función inválida: {str(e)}"}), 400

    f = sp.lambdify(x, f_expr, 'numpy')
    df_expr = sp.diff(f_expr, x)
    df = sp.lambdify(x, df_expr, 'numpy')

    try:
        # 3. Obtener x0 y epsilon del JSON
        x0_str = data.get("x0")
        epsilon_str = data.get("epsilon")

        x0 = float(x0_str)
        epsilon = float(epsilon_str) if epsilon_str else 0.001

        if epsilon < 1e-10:
            return jsonify({"error": "Epsilon demasiado pequeño. Use un valor ≥ 1e-10."}), 400

    except (ValueError, TypeError):
        return jsonify({"error": "Entrada numérica inválida para x₀ o epsilon."}), 400

    steps, error = newton_raphson(f, df, x0, epsilon)

    if error:
        # 4. Devolver errores de lógica como JSON (quizás con 422 o 400)
        return jsonify({"error": error}), 400

    # 5. Si todo sale bien, preparar y enviar los datos de ÉXITO como JSON
    solution = steps[-1]["next_x"]
    iteration_points = [x0] + [step["next_x"] for step in steps]
    iteration_y = [f(val) for val in iteration_points]

    # ... [Tu lógica de cálculo del gráfico es la misma] ...
    min_x = min(iteration_points)
    max_x = max(iteration_points)
    margin = (max_x - min_x) * 0.5 if max_x != min_x else 1
    plot_min = min_x - margin
    plot_max = max_x + margin

    x_vals = np.linspace(plot_min, plot_max, 200)
    y_vals = np.array([f(x) if np.isfinite(f(x)) else np.nan for x in x_vals])
    
    function_latex = sp.latex(f_expr)

    # 6. Devolver todo en un solo objeto JSON
    return jsonify({
        "steps": steps,
        "solution": solution,
        "iterations": len(steps),
        "plot_data": {
            "x_vals": list(x_vals),
            "y_vals": list(y_vals),
            "iteration_points": iteration_points,
            "iteration_y": iteration_y
        },
        "function_latex": function_latex
    }), 200

# Ya no necesitamos la ruta principal "/", React se encargará de eso.
@app.route("/")
@cross_origin()
def serve():
    return send_from_directory(app.static_folder, 'index.html')


if __name__ == "__main__":
    # Asegúrate de correr en el puerto 5000 (o el que prefieras)
    app.run(debug=True, port=5000)