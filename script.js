// SplitWisely App - Complete JavaScript Implementation
class SplitWiselyApp {
    constructor() {
        this.currentView = 'dashboard';
        this.data = {
            groups: [],
            expenses: [],
            balances: {},
            settings: {
                theme: 'light',
                currency: 'USD'
            }
        };
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.setupTheme();
        this.renderDashboard();
        this.showView('dashboard');
    }

    // Data Management
    loadData() {
        try {
            const saved = localStorage.getItem('splitwisely-data');
            if (saved) {
                this.data = { ...this.data, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.showToast('Error loading saved data', 'error');
        }
    }

    saveData() {
        try {
            localStorage.setItem('splitwisely-data', JSON.stringify(this.data));
        } catch (error) {
            console.error('Error saving data:', error);
            this.showToast('Error saving data', 'error');
        }
    }

    // Theme Management
    setupTheme() {
        const savedTheme = this.data.settings.theme || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const themeToggle = document.getElementById('theme-toggle');
        const icon = themeToggle.querySelector('i');
        icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        this.data.settings.theme = newTheme;
        
        const themeToggle = document.getElementById('theme-toggle');
        const icon = themeToggle.querySelector('i');
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        
        this.saveData();
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.showView(view);
            });
        });

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Mobile menu toggle
        document.getElementById('menu-toggle').addEventListener('click', () => {
            document.getElementById('nav').classList.toggle('open');
        });

        // Modal controls
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeModal();
            }
        });

        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // Create Group
        document.getElementById('create-group-btn').addEventListener('click', () => {
            this.openCreateGroupModal();
        });

        document.getElementById('create-first-group').addEventListener('click', () => {
            this.openCreateGroupModal();
        });

        document.getElementById('create-group-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createGroup();
        });

        // Add Member
        document.getElementById('add-member').addEventListener('click', () => {
            this.addMember();
        });

        document.getElementById('member-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addMember();
            }
        });

        // Add Expense
        document.getElementById('quick-add-expense').addEventListener('click', () => {
            this.openAddExpenseModal();
        });

        document.getElementById('add-expense-btn').addEventListener('click', () => {
            this.openAddExpenseModal();
        });

        document.getElementById('add-expense-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        // Split method tabs
        document.querySelectorAll('.split-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchSplitMethod(tab.dataset.method);
            });
        });

        // Expense group filter
        document.getElementById('expense-group-filter').addEventListener('change', () => {
            this.renderExpenses();
        });

        // Settings
        document.getElementById('export-data-btn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('import-data-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        document.getElementById('clear-data-btn').addEventListener('click', () => {
            this.clearData();
        });

        // View navigation
        document.getElementById('view-all-groups').addEventListener('click', () => {
            this.showView('groups');
        });

        document.getElementById('view-all-expenses').addEventListener('click', () => {
            this.showView('expenses');
        });
    }

    // Navigation
    showView(viewName) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.view === viewName) {
                item.classList.add('active');
            }
        });

        // Show/hide views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${viewName}-view`).classList.add('active');

        // Close mobile nav
        document.getElementById('nav').classList.remove('open');

        // Render view content
        this.currentView = viewName;
        this.renderView(viewName);
    }

    renderView(viewName) {
        switch (viewName) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'groups':
                this.renderGroups();
                break;
            case 'expenses':
                this.renderExpenses();
                break;
            case 'balances':
                this.renderBalances();
                break;
            case 'settings':
                this.renderSettings();
                break;
        }
    }

    // Dashboard
    renderDashboard() {
        this.renderRecentGroups();
        this.renderBalanceSummary();
        this.renderRecentExpenses();
    }

    renderRecentGroups() {
        const container = document.getElementById('recent-groups');
        const recentGroups = this.data.groups.slice(-3);

        if (recentGroups.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>No groups yet. Create your first group to get started!</p>
                    <button class="btn btn-primary" id="create-first-group">Create Group</button>
                </div>
            `;
            return;
        }

        container.innerHTML = recentGroups.map(group => `
            <div class="group-item" onclick="app.showView('groups')">
                <div class="group-info">
                    <div class="group-name">${group.name}</div>
                    <div class="group-members">${group.members.length} members</div>
                </div>
                <div class="group-balance">
                    $${this.getGroupBalance(group.id).toFixed(2)}
                </div>
            </div>
        `).join('');
    }

    renderBalanceSummary() {
        const balances = this.calculateUserBalances();
        
        document.getElementById('total-owe').textContent = `$${Math.abs(balances.owe).toFixed(2)}`;
        document.getElementById('total-owed').textContent = `$${balances.owed.toFixed(2)}`;
        
        const net = balances.owed - Math.abs(balances.owe);
        const netElement = document.getElementById('net-balance');
        netElement.textContent = `$${Math.abs(net).toFixed(2)}`;
        netElement.className = `balance-amount ${net >= 0 ? 'owed' : 'owe'}`;
    }

    renderRecentExpenses() {
        const container = document.getElementById('recent-expenses');
        const recentExpenses = this.data.expenses.slice(-5);

        if (recentExpenses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>No expenses yet. Add your first expense!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recentExpenses.map(expense => {
            const group = this.data.groups.find(g => g.id === expense.groupId);
            return `
                <div class="expense-item">
                    <div class="expense-info">
                        <div class="expense-description">${expense.description}</div>
                        <div class="expense-details">
                            ${group ? group.name : 'Unknown Group'} • 
                            Paid by ${expense.paidBy} • 
                            ${new Date(expense.date).toLocaleDateString()}
                        </div>
                    </div>
                    <div class="expense-amount">$${expense.amount.toFixed(2)}</div>
                </div>
            `;
        }).join('');
    }

    // Groups
    renderGroups() {
        const container = document.getElementById('groups-grid');
        
        if (this.data.groups.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>No groups yet. Create your first group to get started!</p>
                    <button class="btn btn-primary" onclick="app.openCreateGroupModal()">Create Group</button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.groups.map(group => {
            const expenses = this.data.expenses.filter(e => e.groupId === group.id);
            const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
            
            return `
                <div class="group-card" onclick="app.showGroupDetails('${group.id}')">
                    <div class="group-card-header">
                        <div>
                            <div class="group-name">${group.name}</div>
                            <div class="group-description">${group.description || 'No description'}</div>
                        </div>
                        <button class="icon-btn" onclick="event.stopPropagation(); app.deleteGroup('${group.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="group-stats">
                        <div class="group-stat">
                            <span class="group-stat-value">${group.members.length}</span>
                            <span class="group-stat-label">Members</span>
                        </div>
                        <div class="group-stat">
                            <span class="group-stat-value">${expenses.length}</span>
                            <span class="group-stat-label">Expenses</span>
                        </div>
                        <div class="group-stat">
                            <span class="group-stat-value">$${totalExpenses.toFixed(2)}</span>
                            <span class="group-stat-label">Total</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Expenses
    renderExpenses() {
        const container = document.getElementById('expenses-list');
        const groupFilter = document.getElementById('expense-group-filter').value;
        
        // Update group filter options
        this.updateExpenseGroupFilter();
        
        let expenses = this.data.expenses;
        if (groupFilter) {
            expenses = expenses.filter(e => e.groupId === groupFilter);
        }

        if (expenses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>${groupFilter ? 'No expenses in this group yet.' : 'No expenses yet. Add your first expense!'}</p>
                    <button class="btn btn-primary" onclick="app.openAddExpenseModal()">Add Expense</button>
                </div>
            `;
            return;
        }

        container.innerHTML = expenses.map(expense => {
            const group = this.data.groups.find(g => g.id === expense.groupId);
            return `
                <div class="expense-item">
                    <div class="expense-info">
                        <div class="expense-description">${expense.description}</div>
                        <div class="expense-details">
                            ${group ? group.name : 'Unknown Group'} • 
                            Paid by ${expense.paidBy} • 
                            ${new Date(expense.date).toLocaleDateString()}
                        </div>
                    </div>
                    <div class="expense-actions">
                        <div class="expense-amount">$${expense.amount.toFixed(2)}</div>
                        <button class="icon-btn" onclick="app.deleteExpense('${expense.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateExpenseGroupFilter() {
        const select = document.getElementById('expense-group-filter');
        select.innerHTML = '<option value="">All Groups</option>' +
            this.data.groups.map(group => 
                `<option value="${group.id}">${group.name}</option>`
            ).join('');
    }

    // Balances
    renderBalances() {
        const container = document.getElementById('balances-content');
        const balances = this.calculateDetailedBalances();
        
        if (Object.keys(balances).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-balance-scale"></i>
                    <p>No balances to show. Add some expenses first!</p>
                </div>
            `;
            return;
        }

        const balanceCards = Object.entries(balances).map(([groupId, groupBalances]) => {
            const group = this.data.groups.find(g => g.id === groupId);
            if (!group) return '';
            
            const settlements = this.optimizeSettlements(groupBalances);
            
            return `
                <div class="card">
                    <div class="card-header">
                        <h3>${group.name}</h3>
                    </div>
                    <div class="card-content">
                        ${settlements.length === 0 ? 
                            '<p class="text-center text-muted">All settled up! 🎉</p>' :
                            settlements.map(settlement => `
                                <div class="settlement-item">
                                    <div class="settlement-info">
                                        <strong>${settlement.from}</strong> owes <strong>${settlement.to}</strong>
                                    </div>
                                    <div class="settlement-actions">
                                        <span class="settlement-amount">$${settlement.amount.toFixed(2)}</span>
                                        <button class="btn btn-sm btn-primary" onclick="app.settleBalance('${groupId}', '${settlement.from}', '${settlement.to}', ${settlement.amount})">
                                            Settle
                                        </button>
                                    </div>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = balanceCards;
    }

    // Settings
    renderSettings() {
        const storageUsed = this.calculateStorageUsage();
        document.getElementById('storage-usage').textContent = `${(storageUsed / 1024).toFixed(2)} KB`;
    }

    // Group Management
    openCreateGroupModal() {
        document.getElementById('create-group-modal').style.display = 'block';
        document.getElementById('modal-overlay').classList.add('active');
        document.getElementById('group-name').focus();
        
        // Clear form
        document.getElementById('create-group-form').reset();
        document.getElementById('members-list').innerHTML = '';
    }

    addMember() {
        const input = document.getElementById('member-name');
        const name = input.value.trim();
        
        if (!name) return;
        
        const membersList = document.getElementById('members-list');
        const existingMembers = Array.from(membersList.children).map(tag => 
            tag.querySelector('span').textContent
        );
        
        if (existingMembers.includes(name)) {
            this.showToast('Member already added', 'warning');
            return;
        }
        
        const memberTag = document.createElement('div');
        memberTag.className = 'member-tag';
        memberTag.innerHTML = `
            <span>${name}</span>
            <button type="button" onclick="this.parentElement.remove()">&times;</button>
        `;
        
        membersList.appendChild(memberTag);
        input.value = '';
        input.focus();
    }

    createGroup() {
        const name = document.getElementById('group-name').value.trim();
        const description = document.getElementById('group-description').value.trim();
        const memberTags = document.querySelectorAll('#members-list .member-tag span');
        const members = Array.from(memberTags).map(tag => tag.textContent);
        
        if (!name) {
            this.showToast('Please enter a group name', 'error');
            return;
        }
        
        if (members.length === 0) {
            this.showToast('Please add at least one member', 'error');
            return;
        }
        
        const group = {
            id: this.generateId(),
            name,
            description,
            members,
            createdAt: new Date().toISOString()
        };
        
        this.data.groups.push(group);
        this.saveData();
        this.closeModal();
        this.showToast('Group created successfully!', 'success');
        
        if (this.currentView === 'groups') {
            this.renderGroups();
        }
        this.renderDashboard();
    }

    deleteGroup(groupId) {
        if (!confirm('Are you sure you want to delete this group? This will also delete all associated expenses.')) {
            return;
        }
        
        this.data.groups = this.data.groups.filter(g => g.id !== groupId);
        this.data.expenses = this.data.expenses.filter(e => e.groupId !== groupId);
        this.saveData();
        this.showToast('Group deleted successfully', 'success');
        this.renderGroups();
        this.renderDashboard();
    }

    // Expense Management
    openAddExpenseModal() {
        if (this.data.groups.length === 0) {
            this.showToast('Please create a group first', 'warning');
            this.openCreateGroupModal();
            return;
        }
        
        document.getElementById('add-expense-modal').style.display = 'block';
        document.getElementById('modal-overlay').classList.add('active');
        
        // Populate group options
        const groupSelect = document.getElementById('expense-group');
        groupSelect.innerHTML = '<option value="">Select a group</option>' +
            this.data.groups.map(group => 
                `<option value="${group.id}">${group.name}</option>`
            ).join('');
        
        // Clear form
        document.getElementById('add-expense-form').reset();
        document.getElementById('expense-payer').innerHTML = '<option value="">Select who paid</option>';
        document.getElementById('split-details').innerHTML = '';
        
        document.getElementById('expense-description').focus();
    }

    updateExpenseMembers() {
        const groupId = document.getElementById('expense-group').value;
        const payerSelect = document.getElementById('expense-payer');
        
        payerSelect.innerHTML = '<option value="">Select who paid</option>';
        
        if (groupId) {
            const group = this.data.groups.find(g => g.id === groupId);
            if (group) {
                payerSelect.innerHTML += group.members.map(member => 
                    `<option value="${member}">${member}</option>`
                ).join('');
                
                this.updateSplitDetails();
            }
        }
    }

    switchSplitMethod(method) {
        document.querySelectorAll('.split-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-method="${method}"]`).classList.add('active');
        
        this.updateSplitDetails();
    }

    updateSplitDetails() {
        const groupId = document.getElementById('expense-group').value;
        const method = document.querySelector('.split-tab.active').dataset.method;
        const amount = parseFloat(document.getElementById('expense-amount').value) || 0;
        const container = document.getElementById('split-details');
        
        if (!groupId) {
            container.innerHTML = '';
            return;
        }
        
        const group = this.data.groups.find(g => g.id === groupId);
        if (!group) return;
        
        if (method === 'equal') {
            const splitAmount = amount / group.members.length;
            container.innerHTML = group.members.map(member => `
                <div class="split-member">
                    <span>${member}</span>
                    <span>$${splitAmount.toFixed(2)}</span>
                </div>
            `).join('');
        } else {
            container.innerHTML = group.members.map(member => `
                <div class="split-member">
                    <span>${member}</span>
                    <input type="number" step="0.01" min="0" placeholder="0.00" data-member="${member}">
                </div>
            `).join('');
        }
    }

    addExpense() {
        const description = document.getElementById('expense-description').value.trim();
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const groupId = document.getElementById('expense-group').value;
        const paidBy = document.getElementById('expense-payer').value;
        const splitMethod = document.querySelector('.split-tab.active').dataset.method;
        
        if (!description || !amount || !groupId || !paidBy) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        if (amount <= 0) {
            this.showToast('Amount must be greater than 0', 'error');
            return;
        }
        
        let splits = {};
        const group = this.data.groups.find(g => g.id === groupId);
        
        if (splitMethod === 'equal') {
            const splitAmount = amount / group.members.length;
            group.members.forEach(member => {
                splits[member] = splitAmount;
            });
        } else {
            const inputs = document.querySelectorAll('#split-details input');
            let totalSplit = 0;
            
            inputs.forEach(input => {
                const memberAmount = parseFloat(input.value) || 0;
                splits[input.dataset.member] = memberAmount;
                totalSplit += memberAmount;
            });
            
            if (Math.abs(totalSplit - amount) > 0.01) {
                this.showToast('Split amounts must equal the total amount', 'error');
                return;
            }
        }
        
        const expense = {
            id: this.generateId(),
            description,
            amount,
            groupId,
            paidBy,
            splits,
            date: new Date().toISOString()
        };
        
        this.data.expenses.push(expense);
        this.saveData();
        this.closeModal();
        this.showToast('Expense added successfully!', 'success');
        
        if (this.currentView === 'expenses') {
            this.renderExpenses();
        }
        this.renderDashboard();
    }

    deleteExpense(expenseId) {
        if (!confirm('Are you sure you want to delete this expense?')) {
            return;
        }
        
        this.data.expenses = this.data.expenses.filter(e => e.id !== expenseId);
        this.saveData();
        this.showToast('Expense deleted successfully', 'success');
        this.renderExpenses();
        this.renderDashboard();
    }

    // Balance Calculations
    calculateUserBalances() {
        let totalOwe = 0;
        let totalOwed = 0;
        
        this.data.expenses.forEach(expense => {
            Object.entries(expense.splits).forEach(([member, amount]) => {
                if (member === expense.paidBy) {
                    totalOwed += (expense.amount - amount);
                } else {
                    totalOwe += amount;
                }
            });
        });
        
        return { owe: totalOwe, owed: totalOwed };
    }

    calculateDetailedBalances() {
        const balances = {};
        
        this.data.expenses.forEach(expense => {
            if (!balances[expense.groupId]) {
                balances[expense.groupId] = {};
            }
            
            const groupBalances = balances[expense.groupId];
            
            Object.entries(expense.splits).forEach(([member, amount]) => {
                if (!groupBalances[member]) {
                    groupBalances[member] = {};
                }
                
                if (member !== expense.paidBy) {
                    // This member owes the payer
                    if (!groupBalances[member][expense.paidBy]) {
                        groupBalances[member][expense.paidBy] = 0;
                    }
                    groupBalances[member][expense.paidBy] += amount;
                }
            });
        });
        
        return balances;
    }

    optimizeSettlements(balances) {
        const settlements = [];
        const netBalances = {};
        
        // Calculate net balances for each person
        Object.keys(balances).forEach(person => {
            netBalances[person] = 0;
        });
        
        Object.entries(balances).forEach(([debtor, creditors]) => {
            Object.entries(creditors).forEach(([creditor, amount]) => {
                netBalances[debtor] -= amount;
                netBalances[creditor] += amount;
            });
        });
        
        // Create settlements
        const debtors = Object.entries(netBalances).filter(([_, balance]) => balance < 0);
        const creditors = Object.entries(netBalances).filter(([_, balance]) => balance > 0);
        
        let i = 0, j = 0;
        while (i < debtors.length && j < creditors.length) {
            const [debtor, debtAmount] = debtors[i];
            const [creditor, creditAmount] = creditors[j];
            
            const settleAmount = Math.min(Math.abs(debtAmount), creditAmount);
            
            settlements.push({
                from: debtor,
                to: creditor,
                amount: settleAmount
            });
            
            debtors[i][1] += settleAmount;
            creditors[j][1] -= settleAmount;
            
            if (debtors[i][1] === 0) i++;
            if (creditors[j][1] === 0) j++;
        }
        
        return settlements;
    }

    getGroupBalance(groupId) {
        return this.data.expenses
            .filter(e => e.groupId === groupId)
            .reduce((sum, e) => sum + e.amount, 0);
    }

    settleBalance(groupId, from, to, amount) {
        // In a real app, this would record the settlement
        // For now, we'll just show a confirmation
        if (confirm(`Mark $${amount.toFixed(2)} as paid from ${from} to ${to}?`)) {
            this.showToast('Balance settled successfully!', 'success');
            // Here you would typically record this settlement in your data
        }
    }

    // Modal Management
    closeModal() {
        document.getElementById('modal-overlay').classList.remove('active');
        setTimeout(() => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }, 300);
    }

    // Data Export/Import
    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `splitwisely-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showToast('Data exported successfully!', 'success');
    }

    async importData(file) {
        if (!file) return;
        
        try {
            const text = await file.text();
            const importedData = JSON.parse(text);
            
            // Validate data structure
            if (!importedData.groups || !importedData.expenses) {
                throw new Error('Invalid data format');
            }
            
            if (confirm('This will replace all current data. Are you sure?')) {
                this.data = { ...this.data, ...importedData };
                this.saveData();
                this.showToast('Data imported successfully!', 'success');
                this.renderView(this.currentView);
                this.renderDashboard();
            }
        } catch (error) {
            console.error('Import error:', error);
            this.showToast('Error importing data. Please check the file format.', 'error');
        }
    }

    clearData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            if (confirm('This will delete all groups, expenses, and balances. Continue?')) {
                this.data.groups = [];
                this.data.expenses = [];
                this.data.balances = {};
                this.saveData();
                this.showToast('All data cleared successfully', 'success');
                this.renderView(this.currentView);
                this.renderDashboard();
            }
        }
    }

    // Utility Functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    calculateStorageUsage() {
        const data = JSON.stringify(this.data);
        return new Blob([data]).size;
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icons[type]}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SplitWiselyApp();
    
    // Setup expense form listeners
    document.getElementById('expense-group').addEventListener('change', () => {
        app.updateExpenseMembers();
    });
    
    document.getElementById('expense-amount').addEventListener('input', () => {
        app.updateSplitDetails();
    });
    
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
});