//export  var myFunction;
//module.exports=app
// var chart = new Chart(ctx, {
//     // The type of chart we want to create
//     type: 'line',

//     // The data for our dataset
//     data: {
//         labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
//         datasets: [{
//             label: 'My First dataset',
//             backgroundColor: 'rgb(255, 99, 132)',
//             borderColor: 'rgb(255, 99, 132)',
//             data: [0, 10, 5, 2, 20, 30, 45]
//         }]
//     },

//     // Configuration options go here
//     options: {}
// });
  window.chartColors = {
      red: 'rgb(255, 99, 132)',
      orange: 'rgb(255, 159, 64)',
      yellow: 'rgb(255, 205, 86)',
      green: 'rgb(75, 192, 192)',
      blue: 'rgb(54, 162, 235)',
      purple: 'rgb(153, 102, 255)',
      grey: 'rgb(201, 203, 207)'
    };       

var color = Chart.helpers.color;
var chart;
var barChartData = {
            labels: ["4-3","5-2","6-1","7-0"],
            datasets: [{
                label: 'Republican Wins',
                backgroundColor: color(window.chartColors.red).alpha(0.5).rgbString(),
                borderColor: window.chartColors.red,
                borderWidth: 1,
                data: [

                ]
            }, {
                label: 'Democrat Wins',
                backgroundColor: color(window.chartColors.blue).alpha(0.5).rgbString(),
                borderColor: window.chartColors.blue,
                borderWidth: 1,
                data: [

                ]
            }]

        };
function InitChart() {
            var ctxChart = document.getElementById('myChart').getContext('2d');
            chart = new Chart(ctxChart, {
                responsive:true,
                type: 'bar',
                data: barChartData,
                options: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Data Chart'
                    }
                }
            });
            chart.update();

    };

function addData(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });
    chart.update();
}

function removeData(chart) {
    chart.data.labels.pop();
    chart.data.datasets.forEach((dataset) => {
        dataset.data.pop();
    });
    chart.update();
}    