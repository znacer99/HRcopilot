// Roles Doughnut Chart
const rolesCtx = document.getElementById('rolesChart').getContext('2d');
new Chart(rolesCtx, {
    type: 'doughnut',
    data: {
        labels: window.DASHBOARD_DATA.roles.labels,
        datasets: [{
            data: window.DASHBOARD_DATA.roles.data,
            backgroundColor: ['#1abc9c','#3498db','#9b59b6','#e74c3c','#f1c40f','#95a5a6'],
            borderColor: '#2c3e50',
            borderWidth: 2
        }]
    },
    options: {
        plugins: { legend: { position: 'bottom', labels: { color:'#fff' } } }
    }
});

// New Users Bar Chart
const newUsersCtx = document.getElementById('newUsersChart').getContext('2d');
new Chart(newUsersCtx, {
    type: 'bar',
    data: {
        labels: ['This Week'],
        datasets: [{ label: 'New Users', data: [window.DASHBOARD_DATA.new_users], backgroundColor: '#16a085' }]
    },
    options: {
        plugins: { legend: { display:false } },
        scales: { y:{ beginAtZero:true, ticks:{color:'#fff'} }, x:{ ticks:{color:'#fff'} } }
    }
});

// Inactive Users Bar Chart
const inactiveUsersCtx = document.getElementById('inactiveUsersChart').getContext('2d');
new Chart(inactiveUsersCtx, {
    type: 'bar',
    data: {
        labels: ['Inactive (30d+)'],
        datasets: [{ label: 'Inactive Users', data: [window.DASHBOARD_DATA.inactive_users], backgroundColor: '#95a5a6' }]
    },
    options: {
        plugins: { legend: { display:false } },
        scales: { y:{ beginAtZero:true, ticks:{color:'#fff'} }, x:{ ticks:{color:'#fff'} } }
    }
});

// Recent Activities Line Chart
const activityCtx = document.getElementById('activityChart').getContext('2d');
new Chart(activityCtx, {
    type: 'line',
    data: {
        labels: window.DASHBOARD_DATA.recent_activities.labels,
        datasets: [{
            label: 'Activities',
            data: window.DASHBOARD_DATA.recent_activities.data,
            fill: false,
            borderColor: '#e67e22',
            tension: 0.3
        }]
    },
    options: {
        plugins: { legend: { labels:{color:'#fff'} } },
        scales: { y:{ beginAtZero:true, ticks:{color:'#fff'} }, x:{ ticks:{color:'#fff'} } }
    }
});
