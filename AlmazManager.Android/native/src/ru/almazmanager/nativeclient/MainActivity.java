package ru.almazmanager.nativeclient;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.Typeface;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class MainActivity extends Activity {
    private static final int BG = Color.rgb(12, 15, 20);
    private static final int SURFACE = Color.rgb(24, 29, 37);
    private static final int TEXT = Color.rgb(239, 244, 251);
    private static final int MUTED = Color.rgb(157, 168, 182);
    private static final int BLUE = Color.rgb(53, 122, 246);
    private static final int RED = Color.rgb(235, 87, 87);
    private static final int GREEN = Color.rgb(48, 190, 123);

    private final Handler main = new Handler(Looper.getMainLooper());
    private final DecimalFormat numbers = new DecimalFormat("#,##0.##");
    private LinearLayout content;
    private String apiBase = "http://10.0.2.2:5003/api";
    private String token = "";
    private String fullName = "";
    private String role = "";

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(BG);
        getWindow().setNavigationBarColor(BG);
        SharedPreferences prefs = getSharedPreferences("almaz", MODE_PRIVATE);
        apiBase = prefs.getString("api", apiBase);
        token = prefs.getString("token", "");
        fullName = prefs.getString("name", "");
        role = prefs.getString("role", "");
        if (token.isEmpty()) showLogin(); else showShell();
    }

    private void showLogin() {
        token = "";
        LinearLayout page = vertical(24);
        page.setGravity(Gravity.CENTER_HORIZONTAL);
        page.setPadding(dp(24), dp(72), dp(24), dp(24));

        TextView brand = text("ALMAZ MANAGER", 28, TEXT, true);
        page.addView(brand, matchWrap());
        TextView subtitle = text("Склад рекламных материалов", 15, MUTED, false);
        page.addView(subtitle, margin(matchWrap(), 0, 4, 0, 28));

        EditText server = input("Адрес API", apiBase, false);
        EditText login = input("Логин", "", false);
        EditText password = input("Пароль", "", true);
        page.addView(server, fieldParams());
        page.addView(login, fieldParams());
        page.addView(password, fieldParams());
        Button submit = button("Войти", BLUE);
        page.addView(submit, margin(matchWrap(), 0, 10, 0, 0));
        TextView hint = text("Для эмулятора локальный API: http://10.0.2.2:5003/api", 12, MUTED, false);
        page.addView(hint, margin(matchWrap(), 0, 18, 0, 0));

        submit.setOnClickListener(v -> {
            String enteredLogin = login.getText().toString().trim();
            String enteredPassword = password.getText().toString();
            if (enteredLogin.isEmpty() || enteredPassword.isEmpty()) {
                toast("Введите логин и пароль");
                return;
            }
            apiBase = normalizeApi(server.getText().toString());
            submit.setEnabled(false);
            async(() -> {
                JSONObject body = new JSONObject();
                body.put("login", enteredLogin);
                body.put("password", enteredPassword);
                JSONObject response = new JSONObject(request("POST", "/auth/login", body));
                token = response.getString("accessToken");
                fullName = response.optString("fullName", enteredLogin);
                role = response.optString("role", "");
                getSharedPreferences("almaz", MODE_PRIVATE).edit()
                    .putString("api", apiBase)
                    .putString("token", token)
                    .putString("name", fullName)
                    .putString("role", role)
                    .apply();
                main.post(this::showShell);
            }, submit);
        });

        ScrollView scroll = new ScrollView(this);
        scroll.setBackgroundColor(BG);
        scroll.addView(page);
        setContentView(scroll);
    }

    private void showShell() {
        LinearLayout root = vertical(0);
        root.setBackgroundColor(BG);

        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.VERTICAL);
        header.setPadding(dp(18), dp(18), dp(18), dp(12));
        header.setBackgroundColor(SURFACE);
        header.addView(text("ALMAZ MANAGER", 20, TEXT, true));
        header.addView(text(fullName + (role.isEmpty() ? "" : " · " + role), 12, MUTED, false));
        root.addView(header, new LinearLayout.LayoutParams(-1, -2));

        HorizontalScrollView navScroll = new HorizontalScrollView(this);
        navScroll.setHorizontalScrollBarEnabled(false);
        LinearLayout nav = new LinearLayout(this);
        nav.setOrientation(LinearLayout.HORIZONTAL);
        nav.setPadding(dp(10), dp(8), dp(10), dp(8));
        String[] labels = {"Главная", "Остатки", "Приход", "Расход", "Инвентаризация", "Oracal", "Документы", "Журнал", "Выйти"};
        Runnable[] actions = {
            this::loadDashboard,
            this::loadStocks,
            () -> movementScreen("Receiving"),
            () -> movementScreen("Issue"),
            () -> inventoryScreen(false),
            () -> inventoryScreen(true),
            this::loadDocuments,
            this::loadOperations,
            this::logout,
        };
        for (int i = 0; i < labels.length; i++) {
            Button b = button(labels[i], i == labels.length - 1 ? Color.rgb(72, 78, 90) : BLUE);
            int index = i;
            b.setOnClickListener(v -> actions[index].run());
            nav.addView(b, margin(new LinearLayout.LayoutParams(-2, dp(44)), 0, 0, 8, 0));
        }
        navScroll.addView(nav);
        root.addView(navScroll, new LinearLayout.LayoutParams(-1, -2));

        ScrollView body = new ScrollView(this);
        content = vertical(14);
        content.setPadding(dp(16), dp(12), dp(16), dp(28));
        body.addView(content);
        root.addView(body, new LinearLayout.LayoutParams(-1, 0, 1));
        setContentView(root);
        loadDashboard();
    }

    private void loadDashboard() {
        startPage("Главная", "Актуальное состояние склада");
        loading();
        async(() -> {
            JSONObject data = new JSONObject(request("GET", "/dashboard", null));
            main.post(() -> {
                startPage("Главная", "Актуальное состояние склада");
                LinearLayout row = horizontal();
                row.addView(metric("Материалы", data.optString("activeMaterials", "0")), weighted());
                row.addView(metric("Ниже минимума", data.optString("belowMinimumCount", "0")), weighted());
                content.addView(row, matchWrap());
                LinearLayout daily = horizontal();
                daily.addView(metric("Приход сегодня", data.optString("receivingToday", "0")), weighted());
                daily.addView(metric("Расход сегодня", data.optString("issueToday", "0")), weighted());
                content.addView(daily, margin(matchWrap(), 0, 8, 0, 0));
                section("Требуют внимания");
                JSONArray attention = data.optJSONArray("attentionMaterials");
                if (attention == null || attention.length() == 0) empty("Все остатки в норме");
                else for (int i = 0; i < attention.length(); i++) {
                    JSONObject item = attention.optJSONObject(i);
                    card(item.optString("name"), item.optString("article") + " · " + item.optString("quantity") + " / мин. " + item.optString("minimumQuantity"), RED);
                }
                section("Последние операции");
                JSONArray recent = data.optJSONArray("recentOperations");
                if (recent == null || recent.length() == 0) empty("Операций пока нет");
                else for (int i = 0; i < recent.length(); i++) {
                    JSONObject item = recent.optJSONObject(i);
                    card(item.optString("materialName"), item.optString("type") + " · " + item.optString("quantityChange") + " · " + item.optString("userFullName"), TEXT);
                }
            });
        }, null);
    }

    private void loadStocks() {
        startPage("Остатки", "Текущие количества по доступным категориям");
        loading();
        async(() -> {
            List<JSONObject> items = pagedItems("/stocks/catalog", "items");
            main.post(() -> {
                startPage("Остатки", items.size() + " позиций");
                if (items.isEmpty()) empty("Нет доступных материалов");
                for (JSONObject item : items) {
                    double current = item.optDouble("currentQuantity", 0);
                    double minimum = item.optDouble("minimumQuantity", 0);
                    String line = item.optString("article") + " · " + numbers.format(current) + " " + unit(item.optString("unit")) + " · мин. " + numbers.format(minimum);
                    card(item.optString("materialName"), line, item.optBoolean("belowMinimum") ? RED : GREEN);
                }
            });
        }, null);
    }

    private void movementScreen(String type) {
        boolean receiving = "Receiving".equals(type);
        String title = receiving ? "Приход" : "Расход";
        startPage(title, receiving ? "Оприходование материала" : "Списание материала");
        loading();
        async(() -> {
            List<JSONObject> materials = loadMaterials(null);
            main.post(() -> {
                startPage(title, "Документ будет создан и сразу проведён");
                if (materials.isEmpty()) { empty("Нет доступных материалов"); return; }
                Spinner spinner = materialSpinner(materials);
                EditText quantity = input("Количество", "", false);
                quantity.setInputType(InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_FLAG_DECIMAL);
                EditText comment = input("Комментарий", "", false);
                content.addView(spinner, fieldParams());
                content.addView(quantity, fieldParams());
                content.addView(comment, fieldParams());
                Button post = button(receiving ? "Провести приход" : "Провести расход", receiving ? GREEN : RED);
                content.addView(post, fieldParams());
                post.setOnClickListener(v -> {
                    int position = spinner.getSelectedItemPosition();
                    JSONObject material = materials.get(position);
                    Double qty = decimal(quantity.getText().toString());
                    if (qty == null || qty <= 0) { toast("Укажите количество больше нуля"); return; }
                    if ("Standard".equalsIgnoreCase(material.optString("kind")) && Math.rint(qty) != qty) { toast("Обычный материал учитывается целыми штуками"); return; }
                    if (!receiving && qty > material.optDouble("currentQuantity", 0)) { toast("Недостаточно материала на складе"); return; }
                    post.setEnabled(false);
                    async(() -> {
                        JSONObject item = new JSONObject();
                        item.put("materialId", material.getString("id"));
                        item.put("quantity", qty);
                        JSONObject body = new JSONObject();
                        body.put("type", type);
                        body.put("comment", comment.getText().toString().trim());
                        body.put("items", new JSONArray().put(item));
                        JSONObject created = new JSONObject(request("POST", "/documents", body));
                        request("POST", "/documents/" + created.getString("id") + "/post", null);
                        main.post(() -> { toast(title + " проведён"); movementScreen(type); });
                    }, post);
                });
            });
        }, null);
    }

    private void inventoryScreen(boolean oracal) {
        String title = oracal ? "Инвентаризация Oracal" : "Инвентаризация";
        startPage(title, "Введите фактическое количество только для посчитанных позиций");
        loading();
        async(() -> {
            List<JSONObject> all = loadMaterials(null);
            List<JSONObject> materials = new ArrayList<>();
            for (JSONObject item : all) {
                boolean special = "Oracal641".equalsIgnoreCase(item.optString("kind"));
                if (special == oracal) materials.add(item);
            }
            main.post(() -> {
                startPage(title, "Пустое поле не считается подтверждённым нулём");
                if (materials.isEmpty()) { empty("Нет доступных материалов этого типа"); return; }
                Spinner spinner = materialSpinner(materials);
                EditText actual = input(oracal ? "Факт, м" : "Факт, шт", "", false);
                actual.setInputType(InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_FLAG_DECIMAL);
                EditText comment = input("Комментарий", "", false);
                content.addView(spinner, fieldParams());
                content.addView(actual, fieldParams());
                content.addView(comment, fieldParams());
                Button post = button("Подтвердить и провести", BLUE);
                content.addView(post, fieldParams());
                post.setOnClickListener(v -> {
                    JSONObject material = materials.get(spinner.getSelectedItemPosition());
                    String raw = actual.getText().toString().trim();
                    if (raw.isEmpty()) { toast("Введите факт. Для подтверждённого нуля введите 0"); return; }
                    Double qty = decimal(raw);
                    if (qty == null || qty < 0) { toast("Некорректное количество"); return; }
                    if (!oracal && Math.rint(qty) != qty) { toast("Штучный материал учитывается целыми значениями"); return; }
                    post.setEnabled(false);
                    async(() -> {
                        JSONObject item = new JSONObject();
                        item.put("materialId", material.getString("id"));
                        item.put("actualQuantity", qty);
                        JSONObject body = new JSONObject();
                        body.put("comment", comment.getText().toString().trim());
                        body.put("items", new JSONArray().put(item));
                        JSONObject created = new JSONObject(request("POST", "/inventory-documents", body));
                        request("POST", "/inventory-documents/" + created.getString("id") + "/post", null);
                        main.post(() -> { toast("Инвентаризация проведена"); inventoryScreen(oracal); });
                    }, post);
                });
            });
        }, null);
    }

    private void loadDocuments() {
        startPage("Документы", "Приходы, расходы и инвентаризации");
        loading();
        async(() -> {
            JSONArray warehouse = new JSONArray(request("GET", "/documents", null));
            JSONArray inventory = new JSONArray(request("GET", "/inventory-documents", null));
            main.post(() -> {
                startPage("Документы", (warehouse.length() + inventory.length()) + " документов");
                for (int i = 0; i < warehouse.length(); i++) {
                    JSONObject d = warehouse.optJSONObject(i);
                    card(d.optString("number"), labelType(d.optString("type")) + " · " + d.optString("status") + " · " + d.optInt("itemCount", d.optJSONArray("items") == null ? 0 : d.optJSONArray("items").length()) + " поз.", TEXT);
                }
                for (int i = 0; i < inventory.length(); i++) {
                    JSONObject d = inventory.optJSONObject(i);
                    card(d.optString("number"), "Инвентаризация · " + d.optString("status") + " · " + d.optInt("itemCount") + " поз.", BLUE);
                }
                if (warehouse.length() + inventory.length() == 0) empty("Документов пока нет");
            });
        }, null);
    }

    private void loadOperations() {
        startPage("Журнал операций", "Неизменяемая история движений");
        loading();
        async(() -> {
            JSONObject response = new JSONObject(request("GET", "/operations/journal?page=1&pageSize=200", null));
            JSONArray items = response.optJSONArray("items");
            main.post(() -> {
                startPage("Журнал операций", response.optInt("totalCount") + " операций");
                if (items == null || items.length() == 0) { empty("Операций пока нет"); return; }
                for (int i = 0; i < items.length(); i++) {
                    JSONObject op = items.optJSONObject(i);
                    String detail = op.optString("displayType") + " · " + signed(op.optDouble("quantityChange")) + " · " + op.optString("userName") + (op.optString("documentNumber").isEmpty() ? "" : " · " + op.optString("documentNumber"));
                    card(op.optString("materialName"), detail, op.optDouble("quantityChange") < 0 ? RED : GREEN);
                }
            });
        }, null);
    }

    private List<JSONObject> loadMaterials(String kind) throws Exception {
        List<JSONObject> result = pagedItems("/materials/catalog", "items");
        if (kind == null) return result;
        List<JSONObject> filtered = new ArrayList<>();
        for (JSONObject item : result) if (kind.equalsIgnoreCase(item.optString("kind"))) filtered.add(item);
        return filtered;
    }

    private List<JSONObject> pagedItems(String path, String arrayName) throws Exception {
        List<JSONObject> result = new ArrayList<>();
        int page = 1;
        while (true) {
            String separator = path.contains("?") ? "&" : "?";
            JSONObject response = new JSONObject(request("GET", path + separator + "page=" + page + "&pageSize=100", null));
            JSONArray items = response.optJSONArray(arrayName);
            if (items != null) for (int i = 0; i < items.length(); i++) result.add(items.getJSONObject(i));
            int totalPages = response.optInt("totalPages", 1);
            if (page >= totalPages || totalPages == 0) break;
            page++;
        }
        return result;
    }

    private String request(String method, String path, JSONObject body) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(apiBase + path).openConnection();
        connection.setRequestMethod(method);
        connection.setConnectTimeout(15000);
        connection.setReadTimeout(25000);
        connection.setRequestProperty("Accept", "application/json");
        connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
        if (!token.isEmpty()) connection.setRequestProperty("Authorization", "Bearer " + token);
        if (body != null) {
            connection.setDoOutput(true);
            try (OutputStream out = connection.getOutputStream()) {
                out.write(body.toString().getBytes(StandardCharsets.UTF_8));
            }
        }
        int code = connection.getResponseCode();
        InputStream stream = code >= 200 && code < 300 ? connection.getInputStream() : connection.getErrorStream();
        String result = stream == null ? "" : read(stream);
        connection.disconnect();
        if (code == 401) main.post(this::logout);
        if (code < 200 || code >= 300) {
            String message = "HTTP " + code;
            try { message = new JSONObject(result).optString("message", message); } catch (Exception ignored) { }
            throw new IllegalStateException(message);
        }
        return result.isEmpty() ? "{}" : result;
    }

    private String read(InputStream input) throws Exception {
        StringBuilder result = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) result.append(line);
        }
        return result.toString();
    }

    private void async(ThrowingRunnable task, View disableOnFailure) {
        new Thread(() -> {
            try {
                task.run();
            } catch (Throwable error) {
                main.post(() -> {
                    toast(error.getMessage() == null ? "Ошибка соединения" : error.getMessage());
                    if (disableOnFailure != null) disableOnFailure.setEnabled(true);
                });
            }
        }, "almaz-api").start();
    }

    private void logout() {
        getSharedPreferences("almaz", MODE_PRIVATE).edit().remove("token").remove("name").remove("role").apply();
        token = "";
        showLogin();
    }

    private void startPage(String title, String subtitle) {
        if (content == null) return;
        content.removeAllViews();
        content.addView(text(title, 24, TEXT, true));
        content.addView(text(subtitle, 13, MUTED, false), margin(matchWrap(), 0, 2, 0, 12));
    }

    private void loading() { content.addView(text("Загрузка…", 14, MUTED, false)); }
    private void empty(String value) { content.addView(text(value, 14, MUTED, false), margin(matchWrap(), 0, 12, 0, 0)); }
    private void section(String value) { content.addView(text(value, 16, TEXT, true), margin(matchWrap(), 0, 20, 0, 8)); }

    private LinearLayout metric(String label, String value) {
        LinearLayout box = vertical(4);
        box.setBackgroundColor(SURFACE);
        box.setPadding(dp(14), dp(14), dp(14), dp(14));
        box.addView(text(value, 24, TEXT, true));
        box.addView(text(label, 12, MUTED, false));
        return box;
    }

    private void card(String title, String subtitle, int accent) {
        LinearLayout box = horizontal();
        box.setGravity(Gravity.CENTER_VERTICAL);
        box.setBackgroundColor(SURFACE);
        TextView bar = new TextView(this);
        bar.setBackgroundColor(accent);
        box.addView(bar, new LinearLayout.LayoutParams(dp(4), -1));
        LinearLayout textBox = vertical(2);
        textBox.setPadding(dp(12), dp(12), dp(12), dp(12));
        textBox.addView(text(title, 15, TEXT, true));
        textBox.addView(text(subtitle, 12, MUTED, false));
        box.addView(textBox, weighted());
        content.addView(box, margin(matchWrap(), 0, 0, 0, 8));
    }

    private Spinner materialSpinner(List<JSONObject> materials) {
        Spinner spinner = new Spinner(this);
        spinner.setBackgroundColor(SURFACE);
        List<String> labels = new ArrayList<>();
        for (JSONObject m : materials) {
            String extra = m.optString("colorCode");
            if (extra.isEmpty() && m.has("widthMeters") && !m.isNull("widthMeters")) extra = numbers.format(m.optDouble("widthMeters")) + " м";
            labels.add(m.optString("name") + " · " + m.optString("article") + (extra.isEmpty() ? "" : " · " + extra) + " · остаток " + numbers.format(m.optDouble("currentQuantity")));
        }
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, labels);
        spinner.setAdapter(adapter);
        return spinner;
    }

    private EditText input(String hint, String value, boolean password) {
        EditText field = new EditText(this);
        field.setHint(hint);
        field.setHintTextColor(MUTED);
        field.setTextColor(TEXT);
        field.setTextSize(15);
        field.setSingleLine(true);
        field.setPadding(dp(14), dp(12), dp(14), dp(12));
        field.setBackgroundColor(SURFACE);
        field.setText(value);
        if (password) field.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
        return field;
    }

    private Button button(String label, int color) {
        Button button = new Button(this);
        button.setText(label);
        button.setTextColor(Color.WHITE);
        button.setTextSize(13);
        button.setAllCaps(false);
        button.setBackgroundColor(color);
        button.setPadding(dp(14), 0, dp(14), 0);
        return button;
    }

    private TextView text(String value, int size, int color, boolean bold) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(color);
        if (bold) view.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        return view;
    }

    private LinearLayout vertical(int spacingIgnored) {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setBackgroundColor(BG);
        return layout;
    }

    private LinearLayout horizontal() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.HORIZONTAL);
        return layout;
    }

    private LinearLayout.LayoutParams matchWrap() { return new LinearLayout.LayoutParams(-1, -2); }
    private LinearLayout.LayoutParams weighted() { return new LinearLayout.LayoutParams(0, -2, 1); }
    private LinearLayout.LayoutParams fieldParams() { return margin(matchWrap(), 0, 0, 0, 10); }
    private LinearLayout.LayoutParams margin(LinearLayout.LayoutParams params, int left, int top, int right, int bottom) {
        params.setMargins(dp(left), dp(top), dp(right), dp(bottom));
        return params;
    }

    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    private void toast(String message) { Toast.makeText(this, message, Toast.LENGTH_LONG).show(); }
    private Double decimal(String value) {
        try { return Double.parseDouble(value.trim().replace(',', '.')); } catch (Exception ignored) { return null; }
    }
    private String normalizeApi(String value) {
        String normalized = value.trim();
        if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) normalized = "http://" + normalized;
        while (normalized.endsWith("/")) normalized = normalized.substring(0, normalized.length() - 1);
        if (!normalized.toLowerCase(Locale.ROOT).endsWith("/api")) normalized += "/api";
        return normalized;
    }
    private String unit(String value) {
        if ("Piece".equalsIgnoreCase(value)) return "шт";
        if ("Meter".equalsIgnoreCase(value)) return "м";
        if ("SquareMeter".equalsIgnoreCase(value)) return "м²";
        if ("Kilogram".equalsIgnoreCase(value)) return "кг";
        if ("Liter".equalsIgnoreCase(value)) return "л";
        if ("Roll".equalsIgnoreCase(value)) return "рул.";
        if ("Sheet".equalsIgnoreCase(value)) return "лист";
        return value;
    }
    private String labelType(String value) { return "Receiving".equalsIgnoreCase(value) ? "Приход" : "Issue".equalsIgnoreCase(value) ? "Расход" : value; }
    private String signed(double value) { return (value > 0 ? "+" : "") + numbers.format(value); }

    @FunctionalInterface
    private interface ThrowingRunnable { void run() throws Exception; }
}
