package com.inclucita.controller;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Servlet Controlador para la consulta oficial de datos de identidad en RENIEC vía Decolecta API.
 * Lee el token de autenticación desde el context-param 'DECOLECTA_API_KEY' definido en web.xml.
 */
@WebServlet(name = "ConsultaDniServlet", urlPatterns = {"/api/dni", "/consulta-dni"})
public class ConsultaDniServlet extends HttpServlet {

    private String defaultApiKey;
    private HttpClient httpClient;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        // Obtener la clave configurada en web.xml mediante getInitParameter del ServletContext
        String keyFromWebXml = getServletContext().getInitParameter("DECOLECTA_API_KEY");
        if (keyFromWebXml != null && !keyFromWebXml.trim().isEmpty()) {
            this.defaultApiKey = keyFromWebXml.trim();
        } else {
            this.defaultApiKey = "sk_19467.CHzcqqXEvj6oH28KMANRriG1x57bGBGD";
        }

        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(6))
                .build();
        this.gson = new Gson();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        configurarCabecerasRespuesta(response);

        PrintWriter out = response.getWriter();
        String dni = request.getParameter("dni");

        if (dni == null || !dni.trim().matches("\\d{8}")) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "El número de DNI debe contener exactamente 8 dígitos numéricos.");
            out.print(gson.toJson(err));
            return;
        }

        dni = dni.trim();

        // Obtener la clave activa desde el contexto (permite cambios en tiempo de ejecución)
        String apiKey = getServletContext().getInitParameter("DECOLECTA_API_KEY");
        if (apiKey == null || apiKey.trim().isEmpty()) {
            apiKey = this.defaultApiKey;
        } else {
            apiKey = apiKey.trim();
        }

        try {
            HttpRequest apiRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.decolecta.com/v1/reniec/dni?numero=" + dni))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Accept", "application/json")
                    .header("User-Agent", "IncluCitaWeb/2.0")
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> apiResponse = httpClient.send(apiRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            int status = apiResponse.statusCode();

            if (status == 200) {
                String responseBody = apiResponse.body();
                String firstName = "";
                String firstLastName = "";
                String secondLastName = "";
                String docNumber = dni;
                String fullNameApi = "";

                try {
                    JsonObject json = JsonParser.parseString(responseBody).getAsJsonObject();
                    if (json.has("first_name") && !json.get("first_name").isJsonNull()) {
                        firstName = json.get("first_name").getAsString().trim();
                    }
                    if (json.has("first_last_name") && !json.get("first_last_name").isJsonNull()) {
                        firstLastName = json.get("first_last_name").getAsString().trim();
                    }
                    if (json.has("second_last_name") && !json.get("second_last_name").isJsonNull()) {
                        secondLastName = json.get("second_last_name").getAsString().trim();
                    }
                    if (json.has("document_number") && !json.get("document_number").isJsonNull()) {
                        docNumber = json.get("document_number").getAsString().trim();
                    }
                    if (json.has("full_name") && !json.get("full_name").isJsonNull()) {
                        fullNameApi = json.get("full_name").getAsString().trim();
                    }
                } catch (Exception parseEx) {
                    // Fallback mediante expresiones regulares si el parser tuviese alguna anomalía
                    firstName = extraerCampoJson(responseBody, "first_name");
                    firstLastName = extraerCampoJson(responseBody, "first_last_name");
                    secondLastName = extraerCampoJson(responseBody, "second_last_name");
                    docNumber = extraerCampoJson(responseBody, "document_number");
                    if (docNumber.isEmpty()) docNumber = dni;
                    fullNameApi = extraerCampoJson(responseBody, "full_name");
                }

                // Construcción de nombre legible: Nombres ApellidoPaterno ApellidoMaterno
                StringBuilder sb = new StringBuilder();
                if (!firstName.isEmpty()) sb.append(firstName);
                if (!firstLastName.isEmpty()) {
                    if (sb.length() > 0) sb.append(" ");
                    sb.append(firstLastName);
                }
                if (!secondLastName.isEmpty()) {
                    if (sb.length() > 0) sb.append(" ");
                    sb.append(secondLastName);
                }
                String nombreCompleto = sb.length() > 0 ? sb.toString() : fullNameApi;

                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("dni", docNumber);
                result.put("nombres", firstName);
                result.put("paterno", firstLastName);
                result.put("materno", secondLastName);
                result.put("nombreCompleto", nombreCompleto);
                result.put("source", "DECOLECTA_RENIEC");
                result.put("full_name", !fullNameApi.isEmpty() ? fullNameApi : nombreCompleto);

                out.print(gson.toJson(result));
            } else if (status == 404) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                Map<String, Object> err = new HashMap<>();
                err.put("success", false);
                err.put("message", "No se encontró ningún ciudadano registrado con el DNI " + dni + " en el padrón de RENIEC.");
                out.print(gson.toJson(err));
            } else {
                response.setStatus(status);
                Map<String, Object> err = new HashMap<>();
                err.put("success", false);
                err.put("message", "Respuesta no exitosa del servicio Decolecta (HTTP " + status + ").");
                err.put("detalle", apiResponse.body());
                out.print(gson.toJson(err));
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "La consulta al servicio de DNI fue interrumpida.");
            out.print(gson.toJson(err));
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Error de comunicación con el servicio Decolecta: " + e.getMessage());
            out.print(gson.toJson(err));
        }
    }

    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        configurarCabecerasRespuesta(response);
        response.setStatus(HttpServletResponse.SC_OK);
    }

    private void configurarCabecerasRespuesta(HttpServletResponse response) {
        response.setContentType("application/json;charset=UTF-8");
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    private String extraerCampoJson(String json, String campo) {
        if (json == null || campo == null) return "";
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\"" + java.util.regex.Pattern.quote(campo) + "\"\\s*:\\s*\"([^\"]*)\"");
        java.util.regex.Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return "";
    }
}
