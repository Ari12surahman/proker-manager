let programs = [];
let editingId = null;
let filteredProgramsData = []; // Global variable to store filtered programs

// Format budget input with Rp and thousands separator
function formatBudgetInput(input) {
    let value = input.value;
    value = value.replace(/[^\d]/g, ''); // Remove all non-digit characters
    
    if (value === '') {
        input.value = '';
        return;
    }
    
    const formatted = parseInt(value).toLocaleString('id-ID');
    input.value = 'Rp ' + formatted;
}

// Parse budget value to number
function parseBudget(budgetString) {
    if (!budgetString) return 0;
    return parseInt(budgetString.replace(/[^\d]/g, '')) || 0;
}

// Load data from localStorage
function loadData() {
    try {
        const savedPrograms = localStorage.getItem('programKerjaData');
        if (savedPrograms) {
            programs = JSON.parse(savedPrograms);
        } else {
            programs = [];
        }
    } catch (error) {
        console.error('Error loading data:', error);
        programs = [];
    }
    updateDisplay();
}

// Save data to localStorage
function saveData() {
    try {
        localStorage.setItem('programKerjaData', JSON.stringify(programs));
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Terjadi error saat menyimpan data. Silakan coba lagi.');
    }
}

// Initialize the application
function init() {
    loadData();
    setupEventListeners();
    updateStats();
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('programForm').addEventListener('submit', handleSubmit);
    document.getElementById('cancelEdit').addEventListener('click', cancelEdit);
    document.getElementById('filterDivision').addEventListener('change', filterPrograms);
    document.getElementById('filterStatus').addEventListener('change', filterPrograms); // Event listener untuk filter status baru
}

// Handle form submission
function handleSubmit(e) {
    e.preventDefault();
    
    const formData = {
        division: document.getElementById('division').value,
        programName: document.getElementById('programName').value,
        budget: parseBudget(document.getElementById('budget').value),
        assignee: document.getElementById('assignee').value,
        status: document.getElementById('status').value, // Ambil nilai status
        description: document.getElementById('description').value
    };

    if (editingId !== null) {
        // Update existing program
        const index = programs.findIndex(p => p.id === editingId);
        if (index !== -1) {
            programs[index] = { ...formData, id: editingId };
        }
        editingId = null;
        document.getElementById('formTitle').textContent = 'Tambah Program Kerja Baru';
        document.getElementById('submitText').textContent = 'Tambah Program';
        document.getElementById('cancelEdit').style.display = 'none';
    } else {
        // Add new program
        const newProgram = {
            ...formData,
            id: Date.now()
        };
        programs.push(newProgram);
    }

    saveData();
    updateDisplay();
    updateStats();
    document.getElementById('programForm').reset();
    document.getElementById('status').value = 'Belum Dimulai'; // Reset status ke default
}

// Update display and filter data
function updateDisplay() {
    const tableBody = document.getElementById('programTableBody');
    const filterDivision = document.getElementById('filterDivision').value;
    const filterStatus = document.getElementById('filterStatus').value; // Ambil nilai filter status
    
    let currentPrograms = programs; // Start with all programs

    // Apply division filter
    if (filterDivision) {
        currentPrograms = currentPrograms.filter(p => p.division === filterDivision);
    }

    // Apply status filter
    if (filterStatus) {
        currentPrograms = currentPrograms.filter(p => p.status === filterStatus);
    }

    // Store the filtered data globally for download/delete functions
    filteredProgramsData = currentPrograms;

    if (filteredProgramsData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                    </svg>
                    <p>Belum ada program kerja yang ditambahkan</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = filteredProgramsData.map(program => `
        <tr>
            <td><span class="division-badge">${program.division}</span></td>
            <td><strong>${program.programName}</strong></td>
            <td class="currency">${formatCurrency(program.budget)}</td>
            <td>${program.assignee}</td>
            <td><span class="status-badge status-${program.status.toLowerCase().replace(/\s/g, '-') /* class for styling */}">${program.status}</span></td> <td>${program.description || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-warning btn-small" onclick="editProgram(${program.id})">
                        <span>✏️</span>
                        <span>Edit</span>
                    </button>
                    <button class="btn btn-danger btn-small" onclick="deleteProgram(${program.id})">
                        <span>🗑️</span>
                        <span>Hapus</span>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Edit program
function editProgram(id) {
    const program = programs.find(p => p.id === id);
    if (!program) return;

    document.getElementById('division').value = program.division;
    document.getElementById('programName').value = program.programName;
    document.getElementById('budget').value = 'Rp ' + program.budget.toLocaleString('id-ID');
    document.getElementById('assignee').value = program.assignee;
    document.getElementById('status').value = program.status; // Set nilai status untuk diedit
    document.getElementById('description').value = program.description;

    editingId = id;
    document.getElementById('formTitle').textContent = 'Edit Program Kerja';
    document.getElementById('submitText').textContent = 'Update Program';
    document.getElementById('cancelEdit').style.display = 'inline-flex';

    // Scroll to form
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

// Cancel edit
function cancelEdit() {
    editingId = null;
    document.getElementById('formTitle').textContent = 'Tambah Program Kerja Baru';
    document.getElementById('submitText').textContent = 'Tambah Program';
    document.getElementById('cancelEdit').style.display = 'none';
    document.getElementById('programForm').reset();
    document.getElementById('status').value = 'Belum Dimulai'; // Reset status ke default
}

// Delete individual program
function deleteProgram(id) {
    if (confirm('Apakah Anda yakin ingin menghapus program ini?')) {
        programs = programs.filter(p => p.id !== id);
        saveData();
        updateDisplay();
        updateStats();
    }
}

// Filter programs (triggered by select change)
function filterPrograms() {
    updateDisplay();
    updateStats(); // Update stats based on filtered data
}

// Update statistics (now reflects filtered view if filter is active)
function updateStats() {
    const totalPrograms = programs.length; // Still show total programs overall
    const totalBudget = programs.reduce((sum, p) => sum + p.budget, 0); // Still show total budget overall
    
    // Count unique divisions based on all programs
    const uniqueDivisions = new Set(programs.map(p => p.division)).size;

    // Count programs by status
    const statusCounts = programs.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
    }, {});

    document.getElementById('totalPrograms').textContent = totalPrograms;
    document.getElementById('totalBudget').textContent = formatCurrency(totalBudget);
    document.getElementById('totalDivisions').textContent = uniqueDivisions;
    document.getElementById('statusBelumDimulai').textContent = statusCounts['Belum Dimulai'] || 0;
    document.getElementById('statusSedangBerjalan').textContent = statusCounts['Sedang Berjalan'] || 0;
    document.getElementById('statusSelesai').textContent = statusCounts['Selesai'] || 0;
}


// Download Excel - uses filteredProgramsData
function downloadExcel() {
    if (filteredProgramsData.length === 0) {
        alert('Tidak ada data yang difilter untuk diunduh ke Excel.');
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(filteredProgramsData.map(p => ({
        'Divisi': p.division,
        'Nama Program': p.programName,
        'Anggaran': p.budget,
        'Penanggung Jawab': p.assignee,
        'Status': p.status, // Tambahkan status ke Excel
        'Deskripsi': p.description || ''
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Program Kerja Filtered');
    
    const filterDivText = document.getElementById('filterDivision').value ? `_${document.getElementById('filterDivision').value}` : '';
    const filterStatText = document.getElementById('filterStatus').value ? `_${document.getElementById('filterStatus').value.replace(/\s/g, '')}` : '';
    const fileName = `program_kerja${filterDivText}${filterStatText}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    alert('Data yang difilter berhasil diunduh ke Excel!');
}

// Download PDF - uses filteredProgramsData
function downloadPDF() {
    if (filteredProgramsData.length === 0) {
        alert('Tidak ada data yang difilter untuk diunduh ke PDF.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const filterDivText = document.getElementById('filterDivision').value ? ` (Divisi: ${document.getElementById('filterDivision').value})` : '';
    const filterStatText = document.getElementById('filterStatus').value ? ` (Status: ${document.getElementById('filterStatus').value})` : '';

    doc.setFontSize(20);
    doc.text(`Program Kerja${filterDivText}${filterStatText}`, 20, 20);

    doc.setFontSize(12);
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 20, 35);

    let y = 50;
    
    const tableRows = [];

    filteredProgramsData.forEach(program => {
        const programData = [
            program.division,
            program.programName,
            formatCurrency(program.budget),
            program.assignee,
            program.status, // Tambahkan status ke PDF
            program.description || '-'
        ];
        tableRows.push(programData);
    });

    // Manual content generation
    doc.setFontSize(10);
    tableRows.forEach(row => {
        if (y > 270) { // Check for page overflow
            doc.addPage();
            y = 20;
        }
        doc.text(`Divisi: ${row[0]}`, 20, y);
        doc.text(`Program: ${row[1]}`, 20, y + 5);
        doc.text(`Anggaran: ${row[2]}`, 20, y + 10);
        doc.text(`Penanggung Jawab: ${row[3]}`, 20, y + 15);
        doc.text(`Status: ${row[4]}`, 20, y + 20); // Tampilkan Status
        doc.text(`Deskripsi: ${row[5]}`, 20, y + 25);
        y += 35; // Increment y for the next program (adjusted for new field)
    });


    const fileName = `program_kerja${filterDivText}${filterStatText}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    alert('Data yang difilter berhasil diunduh ke PDF!');
}

// Clear only filtered data (now considers both division and status filters)
function clearFilteredData() {
    const filterDivision = document.getElementById('filterDivision').value;
    const filterStatus = document.getElementById('filterStatus').value;

    if (!filterDivision && !filterStatus) {
        alert('Pilih divisi atau status terlebih dahulu untuk menggunakan fitur "Hapus Filtered". Jika ingin menghapus semua data, gunakan tombol "Hapus Semua".');
        return;
    }

    let confirmMessage = 'Apakah Anda yakin ingin menghapus SEMUA program kerja ';
    if (filterDivision && filterStatus) {
        confirmMessage += `dari divisi "${filterDivision}" dengan status "${filterStatus}"?`;
    } else if (filterDivision) {
        confirmMessage += `dari divisi "${filterDivision}"?`;
    } else if (filterStatus) {
        confirmMessage += `dengan status "${filterStatus}"?`;
    }
    confirmMessage += ' Tindakan ini tidak dapat dibatalkan!';

    if (confirm(confirmMessage)) {
        // Filter out the programs that DO NOT match the current filters
        programs = programs.filter(p => {
            const matchDivision = filterDivision ? p.division === filterDivision : true;
            const matchStatus = filterStatus ? p.status === filterStatus : true;
            return !(matchDivision && matchStatus);
        });
        saveData();
        updateDisplay();
        updateStats();
        alert('Data yang difilter berhasil dihapus!');
    }
}

// Clear all data
function clearAllData() {
    if (confirm('Apakah Anda yakin ingin menghapus SEMUA data program kerja? Tindakan ini tidak dapat dibatalkan!')) {
        programs = [];
        saveData();
        updateDisplay();
        updateStats();
        alert('Semua data berhasil dihapus!');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);