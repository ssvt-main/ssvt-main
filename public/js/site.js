(function () {
  const RENDER_API_BASE_URL = "https://ssvt-site-1.onrender.com";
  const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
  const API_BASE_URL = LOCAL_HOSTS.has(window.location.hostname) ? "" : RENDER_API_BASE_URL;
  const classOrder = [10, 9, 8, 7, 6];
  const page = document.body.dataset.page;

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  document.querySelectorAll(".is-disabled").forEach((link) => {
    link.addEventListener("click", (event) => event.preventDefault());
  });

  function suffix(rank) {
    const value = Number(rank);
    const mod100 = value % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
    if (value % 10 === 1) return `${value}st`;
    if (value % 10 === 2) return `${value}nd`;
    if (value % 10 === 3) return `${value}rd`;
    return `${value}th`;
  }

  function classLabel(classLevel) {
    return `Class ${suffix(classLevel)}`;
  }

  function escapeText(value) {
    return String(value ?? "");
  }

  function stars(rating) {
    const count = Math.max(1, Math.min(5, Number(rating) || 1));
    return "★".repeat(count) + "☆".repeat(5 - count);
  }

  function percent(obtained, total) {
    if (!total) return "0%";
    return `${((Number(obtained) / Number(total)) * 100).toFixed(1)}%`;
  }

  function formatDate(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(new Date(value));
  }

  async function api(path, options = {}) {
    const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json"
      },
      ...options
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }

    return data;
  }

  async function loadData() {
    return api("/api/data");
  }

  function latestNumber(values) {
    return [...values].sort((a, b) => Number(b) - Number(a))[0];
  }

  function latestTestKey(results) {
    const tests = getTests(results);
    return tests[0]?.key || "";
  }

  function getTests(results) {
    const map = new Map();

    results.forEach((result) => {
      const key = `${result.testDate}__${result.testName}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          testName: result.testName,
          testDate: result.testDate
        });
      }
    });

    return [...map.values()].sort((a, b) => {
      const dateCompare = String(b.testDate).localeCompare(String(a.testDate));
      if (dateCompare !== 0) return dateCompare;
      return String(a.testName).localeCompare(String(b.testName));
    });
  }

  function topperPhoto(topper) {
    if (topper.photo) {
      return `<img class="student-photo" src="${topper.photo}" alt="${escapeText(topper.name)}" />`;
    }

    return `<div class="student-initial" aria-hidden="true">${escapeText(topper.name).slice(0, 1).toUpperCase()}</div>`;
  }

  function renderHomeSections(data, year) {
    const target = document.querySelector("#topperSections");
    if (!target) return;

    target.innerHTML = classOrder
      .map((classLevel) => {
        const toppers = data.toppers
          .filter((topper) => Number(topper.year) === Number(year) && Number(topper.classLevel) === classLevel)
          .sort((a, b) => Number(a.rank) - Number(b.rank));

        const body = toppers.length
          ? `<div class="topper-grid">${toppers
              .map(
                (topper) => `
                  <article class="topper-card">
                    ${topperPhoto(topper)}
                    <div class="topper-info">
                      <div class="rank-badge">${suffix(topper.rank)}</div>
                      <h4>${escapeText(topper.name)}</h4>
                      <p><strong>${Number(topper.percentage).toFixed(2)}%</strong> Result</p>
                    </div>
                  </article>`
              )
              .join("")}</div>`
          : `<p class="empty-state">No topper records for ${classLabel(classLevel)} in ${year}.</p>`;

        return `
          <section class="class-section">
            <header class="class-header">
              <h3>${classLabel(classLevel)}</h3>
              <span>${year}</span>
            </header>
            ${body}
          </section>`;
      })
      .join("");
  }

  async function initHome() {
    const data = await loadData();
    const yearFilter = document.querySelector("#yearFilter");
    const years = [...new Set(data.toppers.map((topper) => topper.year))].sort((a, b) => Number(b) - Number(a));
    const selectedYear = latestNumber(years) || new Date().getFullYear();

    yearFilter.innerHTML = years.map((year) => `<option value="${year}">${year}</option>`).join("");
    yearFilter.value = selectedYear;
    renderHomeSections(data, selectedYear);

    yearFilter.addEventListener("change", () => {
      renderHomeSections(data, yearFilter.value);
    });
  }

  function renderEvents(data) {
    const target = document.querySelector("#eventGrid");
    if (!target) return;

    const events = [...data.events].sort((a, b) => String(b.date).localeCompare(String(a.date)));
    target.innerHTML = events.length
      ? events
          .map(
            (event) => `
              <article class="event-card">
                <img src="${event.image}" alt="${escapeText(event.title)}" />
                <div>
                  <h3>${escapeText(event.title)}</h3>
                  <p>${formatDate(event.date)}</p>
                  <p>${escapeText(event.caption || "")}</p>
                </div>
              </article>`
          )
          .join("")
      : `<p class="empty-state">No event pictures have been added yet.</p>`;
  }

  function renderReviews(data) {
    const target = document.querySelector("#reviewList");
    if (!target) return;

    const reviews = [...data.reviews].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    target.innerHTML = reviews.length
      ? reviews
          .map(
            (review) => `
              <article class="review-card">
                <header>
                  <h3>${escapeText(review.name)}</h3>
                  <span class="stars" aria-label="${review.rating} out of 5 stars">${stars(review.rating)}</span>
                </header>
                <p>${escapeText(review.comment)}</p>
              </article>`
          )
          .join("")
      : `<p class="empty-state">No reviews yet.</p>`;
  }

  async function initAbout() {
    let data = await loadData();
    renderEvents(data);
    renderReviews(data);

    const reviewForm = document.querySelector("#reviewForm");
    const message = document.querySelector("#reviewMessage");

    reviewForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(reviewForm);

      try {
        await api("/api/reviews", {
          method: "POST",
          body: JSON.stringify({
            name: formData.get("name"),
            rating: formData.get("rating"),
            comment: formData.get("comment")
          })
        });
        reviewForm.reset();
        document.querySelector("#star5").checked = true;
        message.textContent = "Review added.";
        data = await loadData();
        renderReviews(data);
      } catch (error) {
        message.textContent = error.message;
      }
    });
  }

  function calculateRankRows(results) {
    const sorted = [...results].sort((a, b) => {
      const marksCompare = Number(b.obtainedMarks) - Number(a.obtainedMarks);
      if (marksCompare !== 0) return marksCompare;
      return String(a.studentName).localeCompare(String(b.studentName));
    });

    return sorted.map((result, index) => ({
      ...result,
      rank: index + 1
    }));
  }

  function renderTestSections(data, testKey) {
    const target = document.querySelector("#testSections");
    if (!target) return;

    target.innerHTML = classOrder
      .map((classLevel) => {
        const rows = calculateRankRows(
          data.testResults.filter(
            (result) =>
              Number(result.classLevel) === classLevel &&
              `${result.testDate}__${result.testName}` === testKey
          )
        );

        const body = rows.length
          ? `<div class="table-wrap">
              <table class="rank-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student</th>
                    <th>Obtained</th>
                    <th>Total</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows
                    .map(
                      (row) => `
                        <tr>
                          <td data-label="Rank">${suffix(row.rank)}</td>
                          <td data-label="Student">${escapeText(row.studentName)}</td>
                          <td data-label="Obtained">${row.obtainedMarks}</td>
                          <td data-label="Total">${row.totalMarks}</td>
                          <td data-label="Percentage">${percent(row.obtainedMarks, row.totalMarks)}</td>
                        </tr>`
                    )
                    .join("")}
                </tbody>
              </table>
            </div>`
          : `<p class="empty-state">No results for ${classLabel(classLevel)} in this test.</p>`;

        return `
          <section class="class-section">
            <header class="class-header">
              <h3>${classLabel(classLevel)}</h3>
              <span>${rows[0] ? `${escapeText(rows[0].testName)} - ${formatDate(rows[0].testDate)}` : "No data"}</span>
            </header>
            ${body}
          </section>`;
      })
      .join("");
  }

  async function initStudentData() {
    const data = await loadData();
    const testFilter = document.querySelector("#testFilter");
    const tests = getTests(data.testResults);
    const selected = latestTestKey(data.testResults);

    testFilter.innerHTML = tests
      .map((test) => `<option value="${test.key}">${escapeText(test.testName)} - ${formatDate(test.testDate)}</option>`)
      .join("");
    testFilter.value = selected;
    renderTestSections(data, selected);

    testFilter.addEventListener("change", () => {
      renderTestSections(data, testFilter.value);
    });
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Could not read image file."));
      reader.readAsDataURL(file);
    });
  }

  function setFormValues(form, values) {
    Object.entries(values).forEach(([key, value]) => {
      if (form.elements[key]) {
        form.elements[key].value = value ?? "";
      }
    });
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetHidden(form) {
    [...form.elements].forEach((element) => {
      if (element.type === "hidden") {
        element.value = "";
      }
    });
  }

  function adminItem(title, detail, buttons) {
    return `
      <article class="admin-item">
        <div>
          <h3>${escapeText(title)}</h3>
          <p>${escapeText(detail)}</p>
        </div>
        <div class="admin-actions">${buttons}</div>
      </article>`;
  }

  function renderAdmin(data) {
    const topperList = document.querySelector("#topperAdminList");
    const eventList = document.querySelector("#eventAdminList");
    const testList = document.querySelector("#testAdminList");
    const reviewList = document.querySelector("#reviewAdminList");

    topperList.innerHTML = [...data.toppers]
      .sort((a, b) => Number(b.year) - Number(a.year) || Number(b.classLevel) - Number(a.classLevel) || Number(a.rank) - Number(b.rank))
      .map((topper) =>
        adminItem(
          `${classLabel(topper.classLevel)} - ${suffix(topper.rank)} - ${topper.name}`,
          `${topper.year}, ${Number(topper.percentage).toFixed(2)}%`,
          `<button class="btn small secondary" type="button" data-edit-topper="${topper.id}">Edit</button>
           <button class="btn small danger" type="button" data-delete="toppers" data-id="${topper.id}">Delete</button>`
        )
      )
      .join("");

    eventList.innerHTML = [...data.events]
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .map((event) =>
        adminItem(
          event.title,
          `${formatDate(event.date)} - ${event.caption || "No caption"}`,
          `<button class="btn small secondary" type="button" data-edit-event="${event.id}">Edit</button>
           <button class="btn small danger" type="button" data-delete="events" data-id="${event.id}">Delete</button>`
        )
      )
      .join("");

    testList.innerHTML = [...data.testResults]
      .sort((a, b) => String(b.testDate).localeCompare(String(a.testDate)) || Number(b.classLevel) - Number(a.classLevel))
      .map((result) =>
        adminItem(
          `${classLabel(result.classLevel)} - ${result.studentName}`,
          `${result.testName}, ${formatDate(result.testDate)} - ${result.obtainedMarks}/${result.totalMarks}`,
          `<button class="btn small secondary" type="button" data-edit-test="${result.id}">Edit</button>
           <button class="btn small danger" type="button" data-delete="test-results" data-id="${result.id}">Delete</button>`
        )
      )
      .join("");

    reviewList.innerHTML = [...data.reviews]
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .map((review) =>
        adminItem(
          `${review.name} - ${stars(review.rating)}`,
          review.comment,
          `<button class="btn small danger" type="button" data-delete="reviews" data-id="${review.id}">Delete</button>`
        )
      )
      .join("");

    if (!topperList.innerHTML) topperList.innerHTML = `<p class="empty-state">No toppers yet.</p>`;
    if (!eventList.innerHTML) eventList.innerHTML = `<p class="empty-state">No events yet.</p>`;
    if (!testList.innerHTML) testList.innerHTML = `<p class="empty-state">No test results yet.</p>`;
    if (!reviewList.innerHTML) reviewList.innerHTML = `<p class="empty-state">No reviews yet.</p>`;
  }

  async function initAdmin() {
    let data = await loadData();
    renderAdmin(data);

    const topperForm = document.querySelector("#topperForm");
    const eventForm = document.querySelector("#eventForm");
    const testForm = document.querySelector("#testForm");

    topperForm.elements.year.value = new Date().getFullYear();
    testForm.elements.testDate.valueAsDate = new Date();
    eventForm.elements.date.valueAsDate = new Date();

    document.querySelectorAll("[data-reset-form]").forEach((button) => {
      button.addEventListener("click", () => resetHidden(button.closest("form")));
    });

    topperForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(topperForm);
      const id = formData.get("id");
      const photoFile = topperForm.elements.photoFile.files[0];
      const photo = (await fileToDataUrl(photoFile)) || formData.get("photoCurrent");

      await api(id ? `/api/toppers/${id}` : "/api/toppers", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify({
          classLevel: formData.get("classLevel"),
          year: formData.get("year"),
          rank: formData.get("rank"),
          name: formData.get("name"),
          percentage: formData.get("percentage"),
          photo
        })
      });

      topperForm.reset();
      resetHidden(topperForm);
      topperForm.elements.year.value = new Date().getFullYear();
      data = await loadData();
      renderAdmin(data);
    });

    eventForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(eventForm);
      const id = formData.get("id");
      const uploadedImage = await fileToDataUrl(eventForm.elements.imageFile.files[0]);
      const image = uploadedImage || formData.get("imageUrl") || formData.get("imageCurrent");

      await api(id ? `/api/events/${id}` : "/api/events", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify({
          title: formData.get("title"),
          date: formData.get("date"),
          image,
          caption: formData.get("caption")
        })
      });

      eventForm.reset();
      resetHidden(eventForm);
      eventForm.elements.date.valueAsDate = new Date();
      data = await loadData();
      renderAdmin(data);
    });

    testForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(testForm);
      const id = formData.get("id");

      await api(id ? `/api/test-results/${id}` : "/api/test-results", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify({
          classLevel: formData.get("classLevel"),
          testName: formData.get("testName"),
          testDate: formData.get("testDate"),
          totalMarks: formData.get("totalMarks"),
          studentName: formData.get("studentName"),
          obtainedMarks: formData.get("obtainedMarks")
        })
      });

      testForm.reset();
      resetHidden(testForm);
      testForm.elements.testDate.valueAsDate = new Date();
      data = await loadData();
      renderAdmin(data);
    });

    document.addEventListener("click", async (event) => {
      const editTopperId = event.target.dataset.editTopper;
      const editEventId = event.target.dataset.editEvent;
      const editTestId = event.target.dataset.editTest;
      const deleteCollection = event.target.dataset.delete;
      const deleteId = event.target.dataset.id;

      if (editTopperId) {
        const topper = data.toppers.find((item) => item.id === editTopperId);
        setFormValues(topperForm, {
          id: topper.id,
          photoCurrent: topper.photo,
          classLevel: topper.classLevel,
          year: topper.year,
          rank: topper.rank,
          name: topper.name,
          percentage: topper.percentage
        });
      }

      if (editEventId) {
        const item = data.events.find((eventItem) => eventItem.id === editEventId);
        setFormValues(eventForm, {
          id: item.id,
          imageCurrent: item.image,
          title: item.title,
          date: item.date,
          imageUrl: item.image.startsWith("data:") ? "" : item.image,
          caption: item.caption
        });
      }

      if (editTestId) {
        const result = data.testResults.find((item) => item.id === editTestId);
        setFormValues(testForm, {
          id: result.id,
          classLevel: result.classLevel,
          testName: result.testName,
          testDate: result.testDate,
          totalMarks: result.totalMarks,
          studentName: result.studentName,
          obtainedMarks: result.obtainedMarks
        });
      }

      if (deleteCollection && deleteId) {
        const confirmed = window.confirm("Delete this record?");
        if (!confirmed) return;

        await api(`/api/${deleteCollection}/${deleteId}`, {
          method: "DELETE"
        });
        data = await loadData();
        renderAdmin(data);
      }
    });
  }

  const initializers = {
    home: initHome,
    about: initAbout,
    "student-data": initStudentData,
    admin: initAdmin
  };

  if (initializers[page]) {
    initializers[page]().catch((error) => {
      console.error(error);
      const main = document.querySelector("main");
      if (main) {
        main.insertAdjacentHTML("afterbegin", `<p class="container empty-state">${escapeText(error.message)}</p>`);
      }
    });
  }
})();
