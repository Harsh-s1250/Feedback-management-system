
const API = "/api";

const form = document.getElementById("form");

function showMessage(message, type = "success") {
    const element = document.getElementById("message");

    element.textContent = message;
    element.className = "message " + type;

    setTimeout(() => {
        element.className = "message";
    }, 4000);
}

function openForm() {
    document.getElementById("feedbackForm")
        .classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function closeForm() {
    document.getElementById("feedbackForm")
        .classList.add("hidden");
    form.reset();
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const detail = data.detail;
        throw new Error(
            Array.isArray(detail)
                ? detail.map(x => x.msg).join(", ")
                : detail || "Request failed"
        );
    }

    return response.json();
}

async function loadData() {
    try {
        const search = document.getElementById("search").value;
        const status = document.getElementById("statusFilter").value;
        const category = document.getElementById("categoryFilter").value;

        const params = new URLSearchParams();

        if (search) params.set("search", search);
        if (status) params.set("status", status);
        if (category) params.set("category", category);

        const [records, stats] = await Promise.all([
            apiRequest(`${API}/feedback?${params}`),
            apiRequest(`${API}/dashboard`)
        ]);

        document.getElementById("total").textContent = stats.total;
        document.getElementById("open").textContent = stats.open;
        document.getElementById("progress").textContent =
            stats.in_progress;
        document.getElementById("resolved").textContent =
            stats.resolved;

        document.getElementById("recordCount").textContent =
            `${records.length} records`;

        renderFeedback(records);

    } catch (error) {
        showMessage(error.message, "error");
    }
}

function renderFeedback(records) {
    const container = document.getElementById("feedbackList");

    container.replaceChildren();

    if (!records.length) {
        const empty = document.createElement("p");
        empty.className = "empty";
        empty.textContent = "No feedback records found.";
        container.appendChild(empty);
        return;
    }

    records.forEach(item => {
        const card = document.createElement("article");
        card.className = "feedback-card";

        const heading = document.createElement("h3");
        heading.textContent = item.title;

        const author = document.createElement("p");
        author.textContent = `${item.name} | ${item.email}`;

        const description = document.createElement("p");
        description.textContent = item.description;

        const tags = document.createElement("div");
        tags.className = "tags";

        const category = document.createElement("span");
        category.className = "tag";
        category.textContent = item.category;

        const priority = document.createElement("span");
        priority.className =
            `tag priority-${item.priority.toLowerCase()}`;
        priority.textContent = `${item.priority} Priority`;

        tags.append(category, priority);

        const meta = document.createElement("div");
        meta.className = "feedback-meta";

        const date = document.createElement("small");
        date.textContent = new Date(item.created_at)
            .toLocaleString();

        const status = document.createElement("select");
        status.className = "status-select";
        status.setAttribute("aria-label", "Feedback status");

        ["Open", "In Progress", "Resolved"].forEach(value => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            status.appendChild(option);
        });

        status.value = item.status;

        status.addEventListener("change", () =>
            updateStatus(item.id, status.value)
        );

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () =>
            deleteFeedback(item.id)
        );

        meta.append(date, status, deleteButton);

        card.append(heading, author, description, tags, meta);
        container.appendChild(card);
    });
}

form.addEventListener("submit", async event => {
    event.preventDefault();

    const feedback = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        title: document.getElementById("title").value.trim(),
        description: document.getElementById("description").value.trim(),
        category: document.getElementById("category").value,
        priority: document.getElementById("priority").value
    };

    try {
        await apiRequest(`${API}/feedback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(feedback)
        });

        closeForm();
        showMessage("Feedback submitted successfully!");
        await loadData();

    } catch (error) {
        showMessage(error.message, "error");
    }
});

async function updateStatus(id, status) {
    try {
        await apiRequest(`${API}/feedback/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        });

        showMessage("Feedback status updated!");
        await loadData();

    } catch (error) {
        showMessage(error.message, "error");
        await loadData();
    }
}

async function deleteFeedback(id) {
    if (!confirm("Are you sure you want to delete this feedback?")) {
        return;
    }

    try {
        await apiRequest(`${API}/feedback/${id}`, {
            method: "DELETE"
        });

        showMessage("Feedback deleted successfully!");
        await loadData();

    } catch (error) {
        showMessage(error.message, "error");
    }
}

document.getElementById("search")
    .addEventListener("input", loadData);

document.getElementById("statusFilter")
    .addEventListener("change", loadData);

document.getElementById("categoryFilter")
    .addEventListener("change", loadData);

loadData();
