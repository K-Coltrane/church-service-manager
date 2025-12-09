// Dashboard Application
class ChurchDashboard {
  constructor() {
    this.currentSection = "overview"
    this.isLoggedIn = false
    this.init()
  }

  init() {
    this.setupEventListeners()
    this.showLoginModal()
    this.loadSampleData()
  }

  setupEventListeners() {
    // Login form
    document.getElementById("loginForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleLogin()
    })

    // Navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const section = e.target.closest(".nav-link").dataset.section
        this.showSection(section)
      })
    })

    // Form submissions
    this.setupFormHandlers()

    // Search functionality
    this.setupSearchHandlers()
  }

  showLoginModal() {
    const loginModal = new window.bootstrap.Modal(document.getElementById("loginModal"))
    loginModal.show()
  }

  handleLogin() {
    const email = document.getElementById("loginEmail").value
    const password = document.getElementById("loginPassword").value

    // Demo authentication
    if (email === "admin@church.com" && password === "password123") {
      this.isLoggedIn = true
      window.bootstrap.Modal.getInstance(document.getElementById("loginModal")).hide()
      document.getElementById("dashboard").classList.remove("d-none")
      this.initializeCharts()
      this.loadDashboardData()
    } else {
      alert("Invalid credentials. Use admin@church.com / password123")
    }
  }

  logout() {
    this.isLoggedIn = false
    document.getElementById("dashboard").classList.add("d-none")
    this.showLoginModal()
  }

  showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll(".content-section").forEach((section) => {
      section.classList.add("d-none")
    })

    // Show selected section
    document.getElementById(`${sectionName}-section`).classList.remove("d-none")

    // Update navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active")
    })
    document.querySelector(`[data-section="${sectionName}"]`).classList.add("active")

    // Update page title
    const titles = {
      overview: "Dashboard Overview",
      attendance: "Attendance Management",
      services: "Service Management",
      visitors: "Visitor Management",
      users: "User Management",
      reports: "Reports & Analytics",
    }
    document.getElementById("pageTitle").textContent = titles[sectionName]

    this.currentSection = sectionName
    this.loadSectionData(sectionName)
  }

  initializeCharts() {
    // Attendance Trends Chart
    const attendanceCtx = document.getElementById("attendanceChart").getContext("2d")
    new window.Chart(attendanceCtx, {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Attendance",
            data: [65, 78, 90, 81, 95, 89],
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "#f3f4f6",
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    })

    // Service Types Chart
    const serviceCtx = document.getElementById("serviceChart").getContext("2d")
    new window.Chart(serviceCtx, {
      type: "doughnut",
      data: {
        labels: ["Sunday Service", "Bible Study", "Prayer Meeting", "Youth Service"],
        datasets: [
          {
            data: [45, 25, 20, 10],
            backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    })
  }

  loadSampleData() {
    // Sample data for demonstration
    this.sampleData = {
      attendance: [
        {
          id: 1,
          date: "2024-01-14",
          service: "Sunday Morning Service",
          visitor: "John Smith",
          checkinTime: "09:30 AM",
          status: "Present",
        },
        {
          id: 2,
          date: "2024-01-14",
          service: "Sunday Morning Service",
          visitor: "Mary Johnson",
          checkinTime: "09:25 AM",
          status: "Present",
        },
        {
          id: 3,
          date: "2024-01-11",
          service: "Bible Study",
          visitor: "David Wilson",
          checkinTime: "07:00 PM",
          status: "Present",
        },
      ],
      services: [
        {
          id: 1,
          name: "Sunday Morning Service",
          type: "Sunday Service",
          date: "2024-01-14",
          time: "10:00 AM",
          attendance: 87,
          status: "Completed",
        },
        {
          id: 2,
          name: "Wednesday Bible Study",
          type: "Bible Study",
          date: "2024-01-17",
          time: "07:00 PM",
          attendance: 45,
          status: "Scheduled",
        },
        {
          id: 3,
          name: "Youth Service",
          type: "Youth Service",
          date: "2024-01-19",
          time: "06:00 PM",
          attendance: 32,
          status: "Scheduled",
        },
      ],
      visitors: [
        {
          id: 1,
          name: "John Smith",
          email: "john.smith@email.com",
          phone: "+1 (555) 123-4567",
          firstVisit: "2024-01-07",
          totalVisits: 3,
        },
        {
          id: 2,
          name: "Mary Johnson",
          email: "mary.johnson@email.com",
          phone: "+1 (555) 987-6543",
          firstVisit: "2023-12-15",
          totalVisits: 8,
        },
        {
          id: 3,
          name: "David Wilson",
          email: "david.wilson@email.com",
          phone: "+1 (555) 456-7890",
          firstVisit: "2024-01-10",
          totalVisits: 2,
        },
      ],
      users: [
        {
          id: 1,
          name: "Admin User",
          email: "admin@church.com",
          role: "Administrator",
          status: "Active",
          lastLogin: "2024-01-14 09:00 AM",
        },
        {
          id: 2,
          name: "Sarah Connor",
          email: "sarah@church.com",
          role: "Usher",
          status: "Active",
          lastLogin: "2024-01-13 06:30 PM",
        },
        {
          id: 3,
          name: "Mike Johnson",
          email: "mike@church.com",
          role: "Usher",
          status: "Inactive",
          lastLogin: "2024-01-10 10:15 AM",
        },
      ],
    }
  }

  loadDashboardData() {
    // Load initial overview data
    this.loadSectionData("overview")
  }

  loadSectionData(section) {
    switch (section) {
      case "attendance":
        this.loadAttendanceData()
        break
      case "services":
        this.loadServicesData()
        break
      case "visitors":
        this.loadVisitorsData()
        break
      case "users":
        this.loadUsersData()
        break
    }
  }

  loadAttendanceData() {
    const tbody = document.getElementById("attendanceTableBody")
    tbody.innerHTML = ""

    this.sampleData.attendance.forEach((record) => {
      const row = document.createElement("tr")
      row.innerHTML = `
                <td>${record.date}</td>
                <td>${record.service}</td>
                <td>${record.visitor}</td>
                <td>${record.checkinTime}</td>
                <td><span class="badge bg-success">${record.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `
      tbody.appendChild(row)
    })
  }

  loadServicesData() {
    const grid = document.getElementById("servicesGrid")
    grid.innerHTML = ""

    this.sampleData.services.forEach((service) => {
      const statusClass = service.status === "Completed" ? "success" : "primary"
      const card = document.createElement("div")
      card.className = "col-md-6 col-lg-4 mb-3"
      card.innerHTML = `
                <div class="card border-0 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title text-gray-800">${service.name}</h6>
                            <span class="badge bg-${statusClass}">${service.status}</span>
                        </div>
                        <p class="text-gray-600 small mb-2">
                            <i class="fas fa-calendar me-1"></i>${service.date} at ${service.time}
                        </p>
                        <p class="text-gray-600 small mb-3">
                            <i class="fas fa-users me-1"></i>${service.attendance} attendees
                        </p>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-outline-primary flex-fill">
                                <i class="fas fa-edit me-1"></i>Edit
                            </button>
                            <button class="btn btn-sm btn-outline-success">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `
      grid.appendChild(card)
    })
  }

  loadVisitorsData() {
    const tbody = document.getElementById("visitorsTableBody")
    tbody.innerHTML = ""

    this.sampleData.visitors.forEach((visitor) => {
      const row = document.createElement("tr")
      row.innerHTML = `
                <td>${visitor.name}</td>
                <td>${visitor.email}</td>
                <td>${visitor.phone}</td>
                <td>${visitor.firstVisit}</td>
                <td><span class="badge bg-info">${visitor.totalVisits}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success me-1">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `
      tbody.appendChild(row)
    })
  }

  loadUsersData() {
    const tbody = document.getElementById("usersTableBody")
    tbody.innerHTML = ""

    this.sampleData.users.forEach((user) => {
      const statusClass = user.status === "Active" ? "success" : "secondary"
      const row = document.createElement("tr")
      row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="badge bg-primary">${user.role}</span></td>
                <td><span class="badge bg-${statusClass}">${user.status}</span></td>
                <td>${user.lastLogin}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger">
                        <i class="fas fa-user-times"></i>
                    </button>
                </td>
            `
      tbody.appendChild(row)
    })
  }

  setupFormHandlers() {
    // Add Service Form
    document.getElementById("addServiceForm").addEventListener("submit", (e) => {
      e.preventDefault()
      // Handle form submission
      window.bootstrap.Modal.getInstance(document.getElementById("addServiceModal")).hide()
      this.showNotification("Service added successfully!", "success")
    })

    // Add Visitor Form
    document.getElementById("addVisitorForm").addEventListener("submit", (e) => {
      e.preventDefault()
      // Handle form submission
      window.bootstrap.Modal.getInstance(document.getElementById("addVisitorModal")).hide()
      this.showNotification("Visitor added successfully!", "success")
    })

    // Add User Form
    document.getElementById("addUserForm").addEventListener("submit", (e) => {
      e.preventDefault()
      // Handle form submission
      window.bootstrap.Modal.getInstance(document.getElementById("addUserModal")).hide()
      this.showNotification("User added successfully!", "success")
    })
  }

  setupSearchHandlers() {
    // Visitor search
    const visitorSearch = document.getElementById("visitorSearch")
    if (visitorSearch) {
      visitorSearch.addEventListener("input", (e) => {
        // Implement search functionality
        console.log("Searching visitors:", e.target.value)
      })
    }

    // Visitor filter
    const visitorFilter = document.getElementById("visitorFilter")
    if (visitorFilter) {
      visitorFilter.addEventListener("change", (e) => {
        // Implement filter functionality
        console.log("Filtering visitors:", e.target.value)
      })
    }
  }

  showNotification(message, type = "info") {
    // Create and show notification
    const notification = document.createElement("div")
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`
    notification.style.cssText = "top: 20px; right: 20px; z-index: 9999; min-width: 300px;"
    notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `

    document.body.appendChild(notification)

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 5000)
  }
}

// Global functions
function logout() {
  if (window.dashboard) {
    window.dashboard.logout()
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.dashboard = new ChurchDashboard()
})

// Export functionality
function exportData(type, format) {
  console.log(`Exporting ${type} data as ${format}`)
  // Implement actual export functionality here
  window.dashboard.showNotification(`${type} data exported successfully!`, "success")
}

// Report generation
function generateReport(type, dateRange, format) {
  console.log(`Generating ${type} report for ${dateRange} in ${format} format`)
  // Implement actual report generation here
  window.dashboard.showNotification("Report generated successfully!", "success")
}
