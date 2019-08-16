var ctxLog = document.getElementById('logChart').getContext('2d');
var logChart = new Chart(ctxLog, {
    type: 'bar',
    data: {
        labels: ["0","1","2","3","4","5","6","7"],
        datasets: [{
            label: 'Democrat votes',
            data: [0,0,0,0,0,0,0,0],
            // backgroundColor: color(window.chartColors.blue).alpha(0.5).rgbString(),
            backgroundColor:window.chartColors.blue,

            // borderColor: window.chartColors.blue,
            // backgroundColor: [
            //     'rgba(255, 99, 132, 0.7)',
            //     'rgba(54, 162, 235, 0.7)',
            //     'rgba(255, 206, 86, 0.7)',
            //     'rgba(75, 192, 192, 0.7)',
            //     'rgba(153, 102, 255, 0.7)',
            //     'rgba(255, 159, 64, 0.7)'
            // ],
            // borderColor: [
            //     'rgba(255, 99, 132, 1)',
            //     'rgba(54, 162, 235, 1)',
            //     'rgba(255, 206, 86, 1)',
            //     'rgba(75, 192, 192, 1)',
            //     'rgba(153, 102, 255, 1)',
            //     'rgba(255, 159, 64, 1)'
            // ],
            borderWidth: 1
        },{
            label: 'Republican votes',
            data: [0,0,0,0,0,0,0,0],
            // backgroundColor: color(window.chartColors.red).alpha(0.5).rgbString(),
            // borderColor: window.chartColors.red,
            backgroundColor: window.chartColors.red,
            borderWidth: 1
        }]
    },
    options: {
        scales: {
             xAxes: [{
      stacked: true,
            }],           
            yAxes: [{
                // type: 'logarithmic',
                stacked: true,

                ticks: {
                    // beginAtZero: true,
                     callback: function(value, index, values) {
                      return Number(value.toString());
                    }                   
                }
            }]
        }
    }
});
// logChart.updateScaleDefaults('logarithmic', {
//   ticks: {

//   }
// });