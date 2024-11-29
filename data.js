function showLoadingAlert() {
    const loadingDiv = document.createElement('div');
    Object.assign(loadingDiv.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '20px 40px',
        border: '2px solid #333',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        zIndex: '999999',
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#333',
        pointerEvents: 'auto'
    });
    
    const backdrop = document.createElement('div');
    Object.assign(backdrop.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: '999998'
    });
    
    loadingDiv.textContent = '正在生成报告，请稍候...';
    document.body.appendChild(backdrop);
    document.body.appendChild(loadingDiv);
    
    return {
        close: () => {
            document.body.removeChild(loadingDiv);
            document.body.removeChild(backdrop);
        }
    };
}
// 用户点击总体描述时触发
// 主函数：处理点击事件
// 点击事件处理函数
// 发送请求并显示结果
// 全局变量存储当前选择的列
function showColumnSelectionDialog(columns, callback) {
    // 创建对话框元素
    const dialog = document.createElement('div');
    dialog.style.position = 'fixed';
    dialog.style.top = '50%';
    dialog.style.left = '50%';
    dialog.style.transform = 'translate(-50%, -50%)'; // 保持居中
    dialog.style.backgroundColor = '#fff';
    dialog.style.padding = '0 20px 20px 20px'; // 只保留底部、左边和右边的内边距
    dialog.style.border = '1px solid #ccc';
    dialog.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
    dialog.style.zIndex = '1000';
    dialog.style.borderRadius = '10px'; // 圆角矩形
    dialog.style.width = '400px'; // 设置对话框的宽度
    dialog.style.height = 'auto'; // 高度自适应内容

    dialog.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; background-color: #f0f0f0; padding: 20px 0; border-bottom: 1px solid #ddd; border-radius: 10px 10px 0 0; width: calc(100% + 40px); margin-left: -20px; margin-right: -20px;">
            <h4 style="margin: 0;">请选择需要分析的列：</h4>
        </div>
        <div id="columnCheckboxes" style="padding: 10px 0 10px 0;">
            ${columns.map(col => `
                <label style="display: block; margin: 5px 0;">
                    <input type="checkbox" name="column" value="${col}"> ${col}
                </label>
            `).join('')}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0 20px 0;">
            <button id="confirmButton" style="background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; width: 120px; height: 40px; line-height: 40px; text-align: center; font-size: 14px;">确定</button>
            <button id="cancelButton" style="background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; width: 120px; height: 40px; line-height: 40px; text-align: center; font-size: 14px;">取消</button>
        </div>
    `;

    // 将对话框添加到文档中
    document.body.appendChild(dialog);

    // 设置按钮的事件处理器
    const confirmButton = document.getElementById('confirmButton');
    const cancelButton = document.getElementById('cancelButton');

    confirmButton.onclick = () => {
        const checkboxes = document.querySelectorAll('#columnCheckboxes input[type="checkbox"]');
        const selectedColumns = [];

        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                selectedColumns.push(checkbox.value);
            }
        });

        if (selectedColumns.length === 0) {
            alert('请至少选择一个列名！');
            return;
        }

        document.body.removeChild(dialog);
        callback(selectedColumns);
    };

    cancelButton.onclick = () => {
        document.body.removeChild(dialog);
    };

    // 确保对话框在页面上可见
    console.log('对话框已创建并添加到页面');
}

// 假设这是你的主函数，用于处理用户选择的列
function handleAlgorithmClick1(algorithm) {
    const rawData = localStorage.getItem('analysisData');
    if (!rawData) {
        console.error('LocalStorage 中没有找到数据！');
        alert('LocalStorage 中没有找到数据！请先上传数据。');
        return;
    }

    let analysisData, columnNames;
    try {
        const parsedData = JSON.parse(rawData);
        console.log("LocalStorage 中的原始数据:", parsedData);

        if (!Array.isArray(parsedData)) {
            throw new Error('解析数据失败：数据格式不是数组。');
        }

        // 查找第一个包含有效数据的文件
        const file = parsedData.find(file => file.data && Array.isArray(file.data) && file.data.length > 0);
        if (!file) {
            throw new Error('未找到包含有效数据的文件！请确保上传的文件内容正确。');
        }

        // 获取所有列名
        columnNames = Object.keys(file.data[0]);
        if (columnNames.length === 0) {
            throw new Error('文件中的列为空或无效！');
        }

        // 显示列名选择对话框
        showColumnSelectionDialog(columnNames, selectedColumns => {
            // 用户选择了列名后，提取这些列的数据
            let columnIndex = 0; // 用于跟踪当前处理的是第几个列
            selectedColumns.forEach(selectedColumn => {
                analysisData = file.data.map(item => item[selectedColumn]).filter(value => value !== null && value !== undefined);
                if (analysisData.length === 0) {
                    throw new Error(`列 "${selectedColumn}" 中的值为空或无效！`);
                }

                console.log(`解析后的数据 (列: ${selectedColumn}):`, analysisData);

                // 继续执行原有逻辑，为每个列单独发送请求
                sendDataToBackend(analysisData, selectedColumn, columnIndex, selectedColumns.length);
                columnIndex++;
            });
        });
    } catch (error) {
        console.error('解析数据失败:', error.message);
        alert(error.message);
        return;
    }
}

// 发送数据到后端
function sendDataToBackend(data, columnName, columnIndex, totalColumns) {
    const dataToSend = { data: data, columnName: columnName };

    console.log(`准备发送的请求数据 (列: ${columnName}):`, dataToSend);

    fetch('http://127.0.0.1:7077/analysis/overall', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
    })
        .then((response) => {
            if (!response.ok) {
                console.error('HTTP 请求失败，状态码:', response.status);
                throw new Error(`HTTP error! 状态码: ${response.status}`);
            }

            const contentType = response.headers.get('Content-Type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            } else {
                throw new Error('响应 Content-Type 非 JSON 格式。');
            }
        })
        .then((data) => {
            if (!data || !data.data) {
                console.error('后端返回的数据为空或格式错误:', data);
                alert('后端返回的数据为空或格式错误！');
                return;
            }

            const stats = data.data;

            console.log(`后端返回统计数据 (列: ${columnName}):`, stats);

            const tableContainer = document.getElementById('tableContainer');
            if (!tableContainer) {
                console.error('页面中缺少 id 为 "tableContainer" 的元素。');
                alert('页面中缺少 id 为 "tableContainer" 的容器！');
                return;
            }

            // 清空原有的表格内容（仅在第一次调用时）
            if (columnIndex === 0) {
                tableContainer.innerHTML = '';
            }

            // 添加新的统计结果
            const resultDiv = document.createElement('div');
            resultDiv.className = 'result-column';
            resultDiv.innerHTML =
                `<h3>统计结果（列: ${columnName}）：</h3>
            <ul>
                <li>样本数量: ${stats.count}</li>
                <li>变异系数 (CV): ${stats.cv.toFixed(6)}</li>
                <li>峰度 (Kurtosis): ${stats.kurtosis.toFixed(6)}</li>
                <li>最大值: ${stats.max}</li>
                <li>均值: ${stats.mean.toFixed(2)}</li>
                <li>中位数: ${stats.median}</li>
                <li>最小值: ${stats.min}</li>
                <li>偏度 (Skewness): ${stats.skewness.toFixed(6)}</li>
                <li>标准差 (Std Dev): ${stats.std_dev.toFixed(2)}</li>
                <li>方差: ${stats.variance.toFixed(3)}</li>
            </ul>`;

            tableContainer.appendChild(resultDiv); // 添加新的统计结果
        })
        .catch((error) => {
            console.error('捕获到的错误:', error.message);
            alert(`请求失败：${error.message}`);
        });
}
//渲染线性回归记得是render2
// 渲染表格
// 渲染表格
function renderTable2(data) {
    const tableContainer = document.getElementById("tableContainer");

    // 检查数据是否为数组
    if (!Array.isArray(data) || data.length === 0) {
        tableContainer.innerHTML = "<p>后端返回的数据为空或格式不正确！</p>";
        return;
    }

    // 构建表格 HTML
    let tableHtml = "<table border='1' style='width: 100%; border-collapse: collapse;'>";
    tableHtml += "<thead><tr>";

    // 表头：简单数组的表头为 "Index" 和 "Value"
    tableHtml += "<th style='padding: 8px; text-align: left; border: 1px solid #ddd;'>Index</th>";
    tableHtml += "<th style='padding: 8px; text-align: left; border: 1px solid #ddd;'>Value</th>";
    tableHtml += "</tr></thead><tbody>";

    // 遍历数据生成表格行
    data.forEach((value, index) => {
        tableHtml += "<tr>";
        tableHtml += `<td style='padding: 8px; text-align: left; border: 1px solid #ddd;'>${index}</td>`;
        tableHtml += `<td style='padding: 8px; text-align: left; border: 1px solid #ddd;'>${value.toFixed(2)}</td>`; // 保留两位小数
        tableHtml += "</tr>";
    });

    tableHtml += "</tbody></table>";

    // 将表格插入到页面
    tableContainer.innerHTML = tableHtml;
}

// /* 单一函数实现，函数名为 handleAlgorithmClick2 */
// async function handleAlgorithmClick2() {
//     try {
//         // 从 LocalStorage 获取 analysisData
//         const rawData = localStorage.getItem("analysisData");
//         if (!rawData) {
//             throw new Error("LocalStorage 中未找到键：analysisData");
//         }

//         const files = JSON.parse(rawData);

//         // 提取文件
//         const dataFile = files.find(file => file.fileName === "data.xls");
//         const labelsFile = files.find(file => file.fileName === "labels.xls");
//         const predictDataFile = files.find(file => file.fileName === "predict_data.xls");

//         if (!dataFile || !labelsFile || !predictDataFile) {
//             throw new Error("文件信息不完整，请检查 LocalStorage 中是否包含 data.xls、labels.xls 和 predict_data.xls！");
//         }

//         // 数据格式转换
//         const data = dataFile.data.map(item => [item.x, item.y, item.z]); // 转换为二维数组
//         const labels = Object.values(labelsFile.data[0]); // 转换为一维数组
//         const predictData = predictDataFile.data.map(item => [item.x, item.y, item.z]); // 转换为二维数组

//         // 构造请求体
//         const requestData = {
//             data,
//             labels,
//             predict_data: predictData,
//         };

//         console.log("发送到后端的数据：", requestData);

//         // 发送到后端
//         const response = await fetch("http://127.0.0.1:7077/analysis/linear_regression", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify(requestData),
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error! 状态码: ${response.status}`);
//         }

//         const responseData = await response.json();
//         console.log("后端返回的数据：", responseData);

//         // 渲染表格
//         renderTable2(responseData.data);

//         // 创建 Excel 文件
//         const workbook = XLSX.utils.book_new();
//         const worksheet = XLSX.utils.json_to_sheet(responseData.data.map((value, index) => ({ Index: index, Value: value })));
//         XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

//         // 生成 Blob 对象
//         const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
//         const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

//         // 创建下载链接
//         const url = window.URL.createObjectURL(blob);

//         // 显示确认对话框
//         if (window.confirm("是否下载线性回归结果？")) {
//             const a = document.createElement('a');
//             a.href = url;
//             a.download = 'linear_regression_results.xlsx';
//             a.click();

//             // 释放 URL 对象
//             window.URL.revokeObjectURL(url);
//         }
//     } catch (error) {
//         console.error("操作失败：", error.message);
//         alert(`操作失败：${error.message}`);
//     }
// }
async function handleAlgorithmClick2() {
    try {
        const rawData = localStorage.getItem("analysisData");
        if (!rawData) {
            throw new Error("LocalStorage 中未找到键：analysisData");
        }

        const files = JSON.parse(rawData);
        const dataFile = files.find(file => file.fileName === "data.xls");
        const labelsFile = files.find(file => file.fileName === "labels.xls");
        const predictDataFile = files.find(file => file.fileName === "predict_data.xls");

        if (!dataFile || !labelsFile || !predictDataFile) {
            throw new Error("文件信息不完整，请检查 LocalStorage 中是否包含 data.xls、labels.xls 和 predict_data.xls！");
        }

        const data = dataFile.data.map(item => [item.x, item.y, item.z]);
        const labels = Object.values(labelsFile.data[0]);
        const predictData = predictDataFile.data.map(item => [item.x, item.y, item.z]);

        const requestData = { data, labels, predict_data: predictData };

        const response = await fetch("http://127.0.0.1:7077/analysis/linear_regression", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! 状态码: ${response.status}`);
        }

        const responseData = await response.json();
        console.log("后端返回的数据：", responseData);
        renderTable2(responseData.data);

        // if (window.confirm("是否需要进行智能分析生成报告？")) {
        //     const title = prompt("请输入表格标题:");
        //     if (!title) return;

        //     const description = prompt("请输入分析描述:");
        //     if (!description) return;

        //     const reportRequest = {
        //         algorithm: "线性回归预测",
        //         table: {
        //             title: title,
        //             description: description,
        //             data: data,
        //             labels: labels,
        //             predict_data: predictData
        //         },
        //         analysisResults: {
        //             result: {
        //                 data: responseData.data
        //             }
        //         }
        //     };
        //     console.log("前端传输的数据：", reportRequest);

        //     const reportResponse = await fetch("http://127.0.0.1:7077/llm/report", {
        //         method: "POST",
        //         headers: { "Content-Type": "application/json" },
        //         body: JSON.stringify(reportRequest),
        //     });

        //     if (!reportResponse.ok) {
        //         throw new Error(`生成报告失败! 状态码: ${reportResponse.status}`);
        //     }

        //     const reportData = await reportResponse.json();
        //     const blob = new Blob([reportData.data], { type: 'text/markdown' });
        //     const url = window.URL.createObjectURL(blob);

        //     const a = document.createElement('a');
        //     a.href = url;
        //     a.download = 'analysis_report.md';
        //     a.click();

        //     window.URL.revokeObjectURL(url);
        // }
        if (window.confirm("是否需要进行智能分析生成报告？")) {
            const title = prompt("请输入表格标题:");
            if (!title) return;
        
            const description = prompt("请输入分析描述:");
            if (!description) return;
        
            const loading = showLoadingAlert();
        
            try {
                const reportRequest = {
                    algorithm: "线性回归预测",
                    table: {
                        title: title,
                        description: description,
                        data: data,
                        labels: labels,
                        predict_data: predictData
                    },
                    analysisResults: {
                        result: {
                            data: responseData.data
                        }
                    }
                };
        
                console.log("前端传输的数据：", reportRequest);
                const reportResponse = await fetch("http://127.0.0.1:7077/llm/report", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(reportRequest),
                });
        
                if (!reportResponse.ok) {
                    throw new Error(`生成报告失败! 状态码: ${reportResponse.status}`);
                }
        
                const reportData = await reportResponse.json();
                const blob = new Blob([reportData.data], { type: 'text/markdown' });
                const url = window.URL.createObjectURL(blob);
        
                const a = document.createElement('a');
                a.href = url;
                a.download = 'analysis_report.md';
                a.click();
        
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('生成报告时出错:', error);
                alert('生成报告失败: ' + error.message);
            } finally {
                loading.close(); // 无论成功还是失败，都关闭加载提示
            }
        }

        if (window.confirm("是否下载线性回归结果？")) {
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(responseData.data.map((value, index) => ({
                Index: index,
                Value: value
            })));
            XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'linear_regression_results.xlsx';
            a.click();

            window.URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error("操作失败：", error.message);
        alert(`操作失败：${error.message}`);
    }
}
// 显示灰色预测模态框
function handleAlgorithmClick3() {
    const modal = document.getElementById("greyModal");
    if (!modal) {
        console.error("灰色预测模态框不存在！");
        return;
    }

    // 从 LocalStorage 获取数据
    const rawData = localStorage.getItem("analysisData");
    if (!rawData) {
        alert("LocalStorage 中未找到键：analysisData");
        return;
    }

    const files = JSON.parse(rawData);

    // 假设使用第一个文件
    const file = files[0];
    if (!file || !file.data || !file.data.length) {
        alert("没有找到可用的数据文件，请检查文件内容！");
        return;
    }

    // 提取所有列名
    const columns = Object.keys(file.data[0]);

    // 创建X轴和Y轴选择器
    const xAxisSelect = document.getElementById("xAxis_grey");
    const yAxisSelect = document.getElementById("yAxis_grey");

    // 清空现有的选择器
    xAxisSelect.innerHTML = "";
    yAxisSelect.innerHTML = "";

    // 填充X轴和Y轴选择器（包含时间列）
    columns.forEach(column => {
        const optionX = document.createElement('option');
        optionX.value = column;
        optionX.textContent = column;
        if (column === "时间") {
            optionX.selected = true; // 默认选中时间列
        }
        xAxisSelect.appendChild(optionX);

        const optionY = document.createElement('option');
        optionY.value = column;
        optionY.textContent = column;
        if (column === "时间") {
            optionY.selected = true; // 默认选中时间列
        }
        yAxisSelect.appendChild(optionY);
    });

    // 显示模态框
    modal.style.display = "block";
}
// 关闭模态框
function closeGreyModal() {
    const modal = document.getElementById("greyModal");
    if (modal) {
        modal.style.display = "none";
    }
}

// 提交参数并发送请求
async function submitGreyParameters() {
    try {
        // 获取用户输入的预测步数
        const forecastSteps = parseInt(document.getElementById("forecast_steps_grey").value);

        if (isNaN(forecastSteps) || forecastSteps <= 0) {
            alert("预测步数必须是正整数！");
            return;
        }

        // 获取用户选择的X轴和Y轴
        const xAxis = document.getElementById("xAxis_grey").value;
        const yAxis = document.getElementById("yAxis_grey").value;

        if (xAxis === yAxis) {
            alert("X轴和Y轴不能相同，请重新选择！");
            return;
        }

        // 从 LocalStorage 获取数据
        const rawData = localStorage.getItem("analysisData");
        if (!rawData) {
            throw new Error("LocalStorage 中未找到键：analysisData");
        }

        const files = JSON.parse(rawData);

        // 使用第一个文件
        const file = files[0];
        if (!file) {
            throw new Error("没有找到可用的数据文件，请检查文件内容！");
        }

        // 提取 time_series 和 data 列
        const timeSeries = file.data.map(item => item[xAxis]);
        const data = file.data.map(item => item[yAxis]);

        if (!timeSeries.length || !data.length) {
            throw new Error("时间序列或数据列为空，请检查文件内容！");
        }

        // 构造请求体
        const requestData = {
            time_series: timeSeries,
            data,
            forecast_steps: forecastSteps,
        };

        console.log("发送到后端的数据：", requestData);

        // 发送请求到后端
        const response = await fetch("http://127.0.0.1:7077/analysis/grey_predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! 状态码: ${response.status}`);
        }

        const responseData = await response.json();
        console.log("后端返回的数据：", responseData);

        // 检查后端返回数据格式
        if (responseData && responseData.data && responseData.future_time_series) {
            // 关闭模态框
            closeGreyModal();
            // if (window.confirm("是否需要进行智能分析生成报告？")) {
            //     const title = prompt("请输入表格标题:");
            //     if (!title) return;

            //     const description = prompt("请输入分析描述:");
            //     if (!description) return;

            //     const reportRequest = {
            //         algorithm: "灰色预测",
            //         table: {
            //             title: title,
            //             description: description,
            //             time_series: timeSeries,
            //             data: data,
            //             forecast_steps: forecastSteps
            //         },
            //         analysisResults: {
            //             result: {
            //                 data: responseData.data,
            //                 future_time_series: responseData.future_time_series,
            //             }
            //         }
            //     };

            //     console.log("前端传输的数据：", reportRequest);
            //     const reportResponse = await fetch("http://127.0.0.1:7077/llm/report", {
            //         method: "POST",
            //         headers: { "Content-Type": "application/json" },
            //         body: JSON.stringify(reportRequest),
            //     });

            //     if (!reportResponse.ok) {
            //         throw new Error(`生成报告失败! 状态码: ${reportResponse.status}`);
            //     }

            //     const reportData = await reportResponse.json();
            //     const blob = new Blob([reportData.data], { type: 'text/markdown' });
            //     const url = window.URL.createObjectURL(blob);

            //     const a = document.createElement('a');
            //     a.href = url;
            //     a.download = 'analysis_report.md';
            //     a.click();

            //     window.URL.revokeObjectURL(url);
            // }
            if (window.confirm("是否需要进行智能分析生成报告？")) {
                const title = prompt("请输入表格标题:");
                if (!title) return;
            
                const description = prompt("请输入分析描述:");
                if (!description) return;
            
                const loading = showLoadingAlert();
            
                try {
                    const reportRequest = {
                        algorithm: "灰色预测",
                        table: {
                            title: title,
                            description: description,
                            time_series: timeSeries,
                            data: data,
                            forecast_steps: forecastSteps
                        },
                        analysisResults: {
                            result: {
                                data: responseData.data,
                                future_time_series: responseData.future_time_series,
                            }
                        }
                    };
            
                    console.log("前端传输的数据：", reportRequest);
                    const reportResponse = await fetch("http://127.0.0.1:7077/llm/report", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(reportRequest),
                    });
            
                    if (!reportResponse.ok) {
                        throw new Error(`生成报告失败! 状态码: ${reportResponse.status}`);
                    }
            
                    const reportData = await reportResponse.json();
                    const blob = new Blob([reportData.data], { type: 'text/markdown' });
                    const url = window.URL.createObjectURL(blob);
            
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'analysis_report.md';
                    a.click();
            
                    window.URL.revokeObjectURL(url);
                } catch (error) {
                    console.error('生成报告时出错:', error);
                    alert('生成报告失败: ' + error.message);
                } finally {
                    loading.close(); // 无论成功还是失败，都关闭加载提示
                }
            }
            renderGreyTableAndOfferDownload(responseData, forecastSteps); // 渲染表格并提供下载
        } else {
            throw new Error("后端返回的数据格式不正确！");
        }

    } catch (error) {
        console.error("操作失败：", error.message);
        alert(`操作失败：${error.message}`);
    }
}

// 渲染返回数据为表格，并提供Excel下载选项
function renderGreyTableAndOfferDownload(responseData, forecastSteps) {
    const tableContainer = document.getElementById("tableContainer");

    const { data, future_time_series } = responseData;


    if (!Array.isArray(data) || !Array.isArray(future_time_series)) {
        tableContainer.innerHTML = "<p>后端返回的数据格式不正确！</p>";
        return;
    }

    // 构建表格
    let tableHtml = "<table border='1' style='width: 100%; border-collapse: collapse;'>";
    tableHtml += "<thead><tr>";
    tableHtml += "<th style='padding: 8px; text-align: left; border: 1px solid #ddd;'>未来时间</th>";
    tableHtml += "<th style='padding: 8px; text-align: left; border: 1px solid #ddd;'>预测值</th>";
    tableHtml += "</tr></thead><tbody>";

    for (let i = 0; i < future_time_series.length; i++) {
        tableHtml += "<tr>";
        tableHtml += `<td style='padding: 8px; text-align: left; border: 1px solid #ddd;'>${future_time_series[i]}</td>`;
        tableHtml += `<td style='padding: 8px; text-align: left; border: 1px solid #ddd;'>${data[i].toFixed(2)}</td>`;
        tableHtml += "</tr>";
    }

    tableHtml += "</tbody></table>";

    // 插入表格
    tableContainer.innerHTML = tableHtml;

    // 创建Excel工作簿
    const ws = XLSX.utils.aoa_to_sheet([
        ["未来时间", "预测值"],
        ...future_time_series.map((time, index) => [time, data[index].toFixed(2)])
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // 创建Blob对象
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    // 创建下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grey_forecast.xlsx';
    a.style.display = 'none';

    // 添加到DOM
    document.body.appendChild(a);

    // 提示用户是否下载
    if (confirm('是否要下载预测结果为Excel文件？')) {
        // 模拟点击
        a.click();
    }

    // 清理
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}
// 显示 ARIMA 参数输入模态框
// 显示 ARIMA 参数输入模态框
// 显示 ARIMA 参数输入模态框
// 确保DOM完全加载后再执行脚本
// 确保DOM完全加载后再执行脚本
// 显示 ARIMA 参数输入模态框
// 打开ARIMA模态框并渲染列名选择
function handleAlgorithmClick4() {
    const arimaModal = document.getElementById("arimaModal");
    if (!arimaModal) {
        console.error("ARIMA 模态框不存在！");
        return;
    }

    // 获取LocalStorage中的文件数据
    const rawData = localStorage.getItem("analysisData");
    if (!rawData) {
        console.error("LocalStorage 中未找到键：analysisData");
        return;
    }

    const files = JSON.parse(rawData);
    const file = files[0]; // 假设我们只处理第一个文件，或者你可以根据需要选择特定的文件

    if (!file || !file.data || !Array.isArray(file.data) || file.data.length === 0) {
        console.error("未找到包含时间序列数据的文件或数据为空！");
        return;
    }

    // 获取所有列名
    const columns = Object.keys(file.data[0]);

    // 渲染X轴和Y轴列名选择框
    const xAxisSelect = document.getElementById("xAxis");
    const yAxisSelect = document.getElementById("yAxis");

    if (xAxisSelect && yAxisSelect) {
        // 清空现有的内容
        xAxisSelect.innerHTML = "";
        yAxisSelect.innerHTML = "";

        // 创建选项并添加到选择器
        columns.forEach((column, index) => {
            const optionX = document.createElement('option');
            optionX.value = column;
            optionX.textContent = column;
            if (index === 0) {  // 默认选中第一个列
                optionX.selected = true;
            }
            xAxisSelect.appendChild(optionX);

            const optionY = document.createElement('option');
            optionY.value = column;
            optionY.textContent = column;
            yAxisSelect.appendChild(optionY);
        });

        // 如果需要，也可以设置Y轴的默认值
        // yAxisSelect.value = columns[1];  // 例如，设置第二个列为Y轴的默认值
    } else {
        console.error("X轴或Y轴选择器元素不存在！");
    }

    // 显示ARIMA模态框
    arimaModal.style.display = "block";
}
// 关闭ARIMA模态框
function closeARIMAModal() {
    const arimaModal = document.getElementById("arimaModal");
    if (arimaModal) {
        arimaModal.style.display = "none";

        // 清除输入框值
        document.getElementById("p").value = 1;
        document.getElementById("d").value = 1;
        document.getElementById("q").value = 1;
        document.getElementById("forecast_steps_arima").value = 5;

        // 清除列名选择
        const checkboxes = document.getElementsByName('columns');
        for (let i = 0; i < checkboxes.length; i++) {
            checkboxes[i].checked = (checkboxes[i].value === "时间");
        }
    }
}

// 提交ARIMA参数
async function submitARIMAParameters() {
    try {
        const p = parseInt(document.getElementById("p").value);
        const d = parseInt(document.getElementById("d").value);
        const q = parseInt(document.getElementById("q").value);
        const forecastSteps = parseInt(document.getElementById("forecast_steps_arima").value);

        if (isNaN(p) || p < 0 || isNaN(d) || d < 0 || isNaN(q) || q < 0 || isNaN(forecastSteps) || forecastSteps <= 0) {
            throw new Error("参数输入无效，请检查！");
        }

        const rawData = localStorage.getItem("analysisData");
        if (!rawData) {
            throw new Error("LocalStorage 中未找到键：analysisData");
        }

        const files = JSON.parse(rawData);
        const file = files[0]; // 假设我们只处理第一个文件，或者你可以根据需要选择特定的文件

        if (!file) {
            throw new Error("未找到包含时间序列数据的文件！");
        }

        // 获取用户选择的X轴和Y轴列名
        const xAxis = document.getElementById("xAxis").value;
        const yAxis = document.getElementById("yAxis").value;

        if (xAxis === yAxis) {
            alert("X轴和Y轴不能选择相同的列！");
            return;
        }

        const timeSeries = file.data.map(item => item[xAxis]);
        const data = file.data.map(item => item[yAxis]);

        if (!timeSeries.length || !data.length) {
            throw new Error("时间序列或数据列为空！");
        }

        const requestData = {
            time_series: timeSeries,
            data,
            p,
            d,
            q,
            forecast_steps: forecastSteps,
            file_name: file.fileName  // 将文件名传递给后端
        };

        console.log("发送到后端的数据：", requestData);

        const response = await fetch("http://127.0.0.1:7077/analysis/ARIMA", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! 状态码: ${response.status}`);
        }

        const responseData = await response.json();
        if (responseData && responseData.data && responseData.future_time_series) {
            closeARIMAModal();
            renderARIMATable(responseData);
            // if (window.confirm("是否需要进行智能分析生成报告？")) {
            //     const title = prompt("请输入表格标题:");
            //     if (!title) return;

            //     const description = prompt("请输入分析描述:");
            //     if (!description) return;

            //     const reportRequest = {
            //         algorithm: "ARIMA预测",
            //         table: {
            //             title: title,
            //             description: description,
            //             time_series: timeSeries,
            //             data: data,
            //             p: p,
            //             d: d,
            //             q: q,
            //             forecast_steps: forecastSteps
            //         },
            //         analysisResults: {
            //             result: {
            //                 data: responseData.data,
            //                 future_time_series: responseData.future_time_series,
            //             }
            //         }
            //     };

            //     console.log("前端传输的数据：", reportRequest);
            //     const reportResponse = await fetch("http://127.0.0.1:7077/llm/report", {
            //         method: "POST",
            //         headers: { "Content-Type": "application/json" },
            //         body: JSON.stringify(reportRequest),
            //     });

            //     if (!reportResponse.ok) {
            //         throw new Error(`生成报告失败! 状态码: ${reportResponse.status}`);
            //     }

            //     const reportData = await reportResponse.json();
            //     const blob = new Blob([reportData.data], { type: 'text/markdown' });
            //     const url = window.URL.createObjectURL(blob);

            //     const a = document.createElement('a');
            //     a.href = url;
            //     a.download = 'analysis_report.md';
            //     a.click();

            //     window.URL.revokeObjectURL(url);
            // }
            if (window.confirm("是否需要进行智能分析生成报告？")) {
                const title = prompt("请输入表格标题:");
                if (!title) return;
            
                const description = prompt("请输入分析描述:");
                if (!description) return;
            
                const loading = showLoadingAlert();
            
                try {
                    const reportRequest = {
                        algorithm: "ARIMA预测",
                        table: {
                            title: title,
                            description: description,
                            time_series: timeSeries,
                            data: data,
                            p: p,
                            d: d,
                            q: q,
                            forecast_steps: forecastSteps
                        },
                        analysisResults: {
                            result: {
                                data: responseData.data,
                                future_time_series: responseData.future_time_series,
                            }
                        }
                    };
            
                    console.log("前端传输的数据：", reportRequest);
                    const reportResponse = await fetch("http://127.0.0.1:7077/llm/report", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(reportRequest),
                    });
            
                    if (!reportResponse.ok) {
                        throw new Error(`生成报告失败! 状态码: ${reportResponse.status}`);
                    }
            
                    const reportData = await reportResponse.json();
                    const blob = new Blob([reportData.data], { type: 'text/markdown' });
                    const url = window.URL.createObjectURL(blob);
            
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'analysis_report.md';
                    a.click();
            
                    window.URL.revokeObjectURL(url);
                } catch (error) {
                    console.error('生成报告时出错:', error);
                    alert('生成报告失败: ' + error.message);
                } finally {
                    loading.close(); // 无论成功还是失败，都关闭加载提示
                }
            }
            createDownloadLink(responseData, file.fileName);  // 调用创建下载链接
        }
        else {
            throw new Error("后端返回的数据格式不正确！");
        }
    } catch (error) {
        console.error("操作失败：", error.message);
        alert(`操作失败：${error.message}`);
    }
}

// 渲染ARIMA表格
function renderARIMATable(responseData) {
    const tableContainer = document.getElementById("tableContainer");
    const { data, future_time_series } = responseData;

    if (!Array.isArray(data) || !Array.isArray(future_time_series)) {
        tableContainer.innerHTML = "<p>后端返回的数据格式不正确！</p>";
        return;
    }

    let tableHtml = "<table border='1' style='width: 100%; border-collapse: collapse;'>";
    tableHtml += "<thead><tr><th>未来时间</th><th>预测值</th></tr></thead><tbody>";

    future_time_series.forEach((time, index) => {
        tableHtml += `<tr><td>${time}</td><td>${data[index].toFixed(2)}</td></tr>`;
    });

    tableHtml += "</tbody></table>";
    tableContainer.innerHTML = tableHtml;
}

// 创建下载链接
function createDownloadLink(responseData, fileName) {
    const { data, future_time_series } = responseData;

    // 创建Excel工作簿
    const ws = XLSX.utils.aoa_to_sheet([
        ["未来时间", "预测值"],
        ...future_time_series.map((time, index) => [time, data[index].toFixed(2)])
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // 创建Blob对象
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    // 创建下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.xlsx`;  // 使用传递的文件名
    a.style.display = 'none';

    // 添加到DOM
    document.body.appendChild(a);

    // 提示用户是否下载
    if (confirm('是否要下载预测结果为Excel文件？')) {
        // 模拟点击
        a.click();
    }

    // 清理
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}
// 显示模态框
function handleAlgorithmClick5() {
    const modal = document.getElementById("bpModal");
    modal.style.display = "block";
}

// 关闭模态框
function closeModal() {
    const modal = document.getElementById("bpModal");
    modal.style.display = "none";
}

// 提交用户输入参数并发送请求
async function submitBPParameters() {
    try {
        // 获取用户输入的参数
        const hiddenLayers = parseInt(document.getElementById("hidden_layers").value);
        const maxIter = parseInt(document.getElementById("max_iter").value);
        const learningRateInit = parseFloat(document.getElementById("learning_rate_init").value);

        // 验证用户输入
        if (isNaN(hiddenLayers) || isNaN(maxIter) || isNaN(learningRateInit)) {
            throw new Error("请输入有效的隐藏层数、最大迭代次数和学习率！");
        }

        // 从 LocalStorage 获取数据
        const rawData = localStorage.getItem("analysisData");
        if (!rawData) {
            throw new Error("LocalStorage 中未找到键：analysisData");
        }

        const files = JSON.parse(rawData);

        // 提取文件
        const dataFile = files.find(file => file.fileName === "data.xls");
        const labelsFile = files.find(file => file.fileName === "labels.xls");
        const predictDataFile = files.find(file => file.fileName === "predict_data.xls");

        if (!dataFile || !labelsFile || !predictDataFile) {
            throw new Error("文件信息不完整，请检查 LocalStorage 中是否包含 data.xls、labels.xls 和 predict_data.xls！");
        }

        // 数据格式转换
        const data = dataFile.data.map(item => [item.x, item.y, item.z]); // 转换为二维数组
        const labels = Object.values(labelsFile.data[0]); // 转换为一维数组
        const predictData = predictDataFile.data.map(item => [item.x, item.y, item.z]); // 转换为二维数组

        // 构造请求体
        const requestData = {
            data,
            labels,
            predict_data: predictData,
            hidden_layers: hiddenLayers,
            max_iter: maxIter,
            learning_rate_init: learningRateInit
        };

        console.log("发送到后端的数据：", requestData);

        // 发送请求到后端
        const response = await fetch("http://127.0.0.1:7077/analysis/BP", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! 状态码: ${response.status}`);
        }

        const responseData = await response.json();
        console.log("后端返回的数据：", responseData);

        // 确保后端返回的数据格式正确
        if (responseData && responseData.data) {
            // 关闭模态框
            closeModal();
            // if (window.confirm("是否需要进行智能分析生成报告？")) {
            //     const title = prompt("请输入表格标题:");
            //     if (!title) return;

            //     const description = prompt("请输入分析描述:");
            //     if (!description) return;

            //     const reportRequest = {
            //         algorithm: "BP神经网络预测",
            //         table: {
            //             title: title,
            //             description: description,
            //             data: data,
            //             labels: labels,
            //             predict_data: predictData,
            //             hidden_layers: hiddenLayers,
            //             max_iter: maxIter,
            //             learning_rate_init: learningRateInit
            //         },
            //         analysisResults: {
            //             result: {
            //                 data: responseData.data
            //             }
            //         }
            //     };

            //     console.log("前端传输的数据：", reportRequest);
            //     const reportResponse = await fetch("http://127.0.0.1:7077/llm/report", {
            //         method: "POST",
            //         headers: { "Content-Type": "application/json" },
            //         body: JSON.stringify(reportRequest),
            //     });

            //     if (!reportResponse.ok) {
            //         throw new Error(`生成报告失败! 状态码: ${reportResponse.status}`);
            //     }

            //     const reportData = await reportResponse.json();
            //     const blob = new Blob([reportData.data], { type: 'text/markdown' });
            //     const url = window.URL.createObjectURL(blob);

            //     const a = document.createElement('a');
            //     a.href = url;
            //     a.download = 'analysis_report.md';
            //     a.click();

            //     window.URL.revokeObjectURL(url);
            // }
            if (window.confirm("是否需要进行智能分析生成报告？")) {
                const title = prompt("请输入表格标题:");
                if (!title) return;
            
                const description = prompt("请输入分析描述:");
                if (!description) return;
            
                const loading = showLoadingAlert();
            
                try {
                    const reportRequest = {
                        algorithm: "BP神经网络预测",
                        table: {
                            title: title,
                            description: description,
                            data: data,
                            labels: labels,
                            predict_data: predictData,
                            hidden_layers: hiddenLayers,
                            max_iter: maxIter,
                            learning_rate_init: learningRateInit
                        },
                        analysisResults: {
                            result: {
                                data: responseData.data
                            }
                        }
                    };
            
                    console.log("前端传输的数据：", reportRequest);
                    const reportResponse = await fetch("http://127.0.0.1:7077/llm/report", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(reportRequest),
                    });
            
                    if (!reportResponse.ok) {
                        throw new Error(`生成报告失败! 状态码: ${reportResponse.status}`);
                    }
            
                    const reportData = await reportResponse.json();
                    const blob = new Blob([reportData.data], { type: 'text/markdown' });
                    const url = window.URL.createObjectURL(blob);
            
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'analysis_report.md';
                    a.click();
            
                    window.URL.revokeObjectURL(url);
                } catch (error) {
                    console.error('生成报告时出错:', error);
                    alert('生成报告失败: ' + error.message);
                } finally {
                    loading.close(); // 无论成功还是失败，都关闭加载提示
                }
            }
            renderTable5(responseData.data); // 渲染表格
        } else {
            throw new Error("后端返回的数据格式不正确或 data 字段为空！");
        }

    } catch (error) {
        console.error("操作失败：", error.message);
        alert(`操作失败：${error.message}`);
    }
}

// 表格渲染函数
// 表格渲染函数
function renderTable5(data) {
    const tableContainer = document.getElementById("tableContainer");

    // 检查数据是否为数组
    if (!Array.isArray(data) || data.length === 0) {
        tableContainer.innerHTML = "<p>后端返回的数据为空或格式不正确！</p>";
        return;
    }

    // 构建表格 HTML
    let tableHtml = "<table border='1' style='width: 100%; border-collapse: collapse;'>";
    tableHtml += "<thead><tr>";

    // 表头：简单数组的表头为 "Index" 和 "Value"
    tableHtml += "<th style='padding: 8px; text-align: left; border: 1px solid #ddd;'>Index</th>";
    tableHtml += "<th style='padding: 8px; text-align: left; border: 1px solid #ddd;'>Value</th>";
    tableHtml += "</tr></thead><tbody>";

    // 遍历数据生成表格行
    data.forEach((value, index) => {
        tableHtml += "<tr>";
        tableHtml += `<td style='padding: 8px; text-align: left; border: 1px solid #ddd;'>${index}</td>`;
        tableHtml += `<td style='padding: 8px; text-align: left; border: 1px solid #ddd;'>${value.toFixed(4)}</td>`; // 保留四位小数
        tableHtml += "</tr>";
    });

    tableHtml += "</tbody></table>";

    // 将表格插入到容器
    tableContainer.innerHTML = tableHtml;

    // 创建Excel工作簿
    const ws = XLSX.utils.aoa_to_sheet([
        ["Index", "Value"],
        ...data.map((value, index) => [index, value.toFixed(4)])
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // 创建Blob对象
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    // 创建下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bp_forecast.xlsx';
    a.style.display = 'none';

    // 添加到DOM
    document.body.appendChild(a);

    // 提示用户是否下载
    if (confirm('是否要下载预测结果为Excel文件？')) {
        // 模拟点击
        a.click();

        // 清理
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    } else {
        // 用户选择不下载时清理资源
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}


// 显示 SVM 分类模态框
// 显示 SVM 分类模态框
function handleAlgorithmClick6() {
    const modal = document.getElementById("svmModal");
    if (!modal) {
        console.error("SVM 模态框不存在！");
        return;
    }
    modal.style.display = "block";
}

// 关闭模态框
function closeSVMModal() {
    const modal = document.getElementById("svmModal");
    if (modal) {
        modal.style.display = "none";
    }
}
// 提交参数并发送请求
async function submitSVMParameters() {
    try {
        // 获取用户输入的参数
        const labelsInput = document.getElementById("labels").value.trim();
        const labels = labelsInput.split(",").map(label => label.trim());
        const C = parseFloat(document.getElementById("C").value);
        const tol = parseFloat(document.getElementById("tol").value);
        const maxIter = parseInt(document.getElementById("max_iter").value);

        // 验证用户输入
        if (labels.length === 0) {
            alert("请输入标签！");
            return;
        }
        if (isNaN(C) || C <= 0) {
            alert("C 参数必须是正数！");
            return;
        }
        if (isNaN(tol) || tol <= 0) {
            alert("容差必须是正数！");
            return;
        }
        if (isNaN(maxIter) || maxIter <= 0) {
            alert("最大迭代次数必须是正整数！");
            return;
        }

        // 从 LocalStorage 获取数据
        const rawData = localStorage.getItem("analysisData");
        if (!rawData) {
            throw new Error("LocalStorage 中未找到键：analysisData");
        }

        const files = JSON.parse(rawData);

        // 提取 data 和 predict_data 列
        const dataFile = files.find(file => file.fileName === "data.xls");
        const predictDataFile = files.find(file => file.fileName === "predict_data.xls");

        if (!dataFile || !predictDataFile) {
            throw new Error("未找到数据文件或预测文件，请检查上传文件！");
        }

        const data = dataFile.data.map(item => [item.x, item.y, item.z]); // 转换为二维数组
        const predictData = predictDataFile.data.map(item => [item.x, item.y, item.z]); // 转换为二维数组

        // 构造请求体
        const requestData = {
            data,
            labels,
            predict_data: predictData,
            C,
            tol,
            max_iter: maxIter
        };

        console.log("发送到后端的数据：", requestData);

        // 发送请求到后端
        const response = await fetch("http://127.0.0.1:7077/analysis/SVM", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! 状态码: ${response.status}`);
        }

        const responseData = await response.json();
        console.log("后端返回的数据：", responseData);

        // 检查后端返回数据格式
        if (responseData && responseData.data && responseData.probabilities) {
            // 关闭模态框
            closeSVMModal();
            // if (window.confirm("是否需要进行智能分析生成报告？")) {
            //     const title = prompt("请输入表格标题:");
            //     if (!title) return;

            //     const description = prompt("请输入分析描述:");
            //     if (!description) return;

            //     const reportRequest = {
            //         algorithm: "SVM分类",
            //         table: {
            //             title: title,
            //             description: description,
            //             data: data,
            //             labels: labels,
            //             predict_data: predictData,
            //             C: C,
            //             tol: tol,
            //             max_iter: maxIter
            //         },
            //         analysisResults: {
            //             result: {
            //                 data: responseData.data,
            //                 probabilities: responseData.probabilities
            //             }
            //         }
            //     };

            //     console.log("前端传输的数据：", reportRequest);
            //     const reportResponse = await fetch("http://127.0.0.1:7077/llm/report", {
            //         method: "POST",
            //         headers: { "Content-Type": "application/json" },
            //         body: JSON.stringify(reportRequest),
            //     });

            //     if (!reportResponse.ok) {
            //         throw new Error(`生成报告失败! 状态码: ${reportResponse.status}`);
            //     }

            //     const reportData = await reportResponse.json();
            //     const blob = new Blob([reportData.data], { type: 'text/markdown' });
            //     const url = window.URL.createObjectURL(blob);

            //     const a = document.createElement('a');
            //     a.href = url;
            //     a.download = 'analysis_report.md';
            //     a.click();

            //     window.URL.revokeObjectURL(url);
            // }
            if (window.confirm("是否需要进行智能分析生成报告？")) {
                const title = prompt("请输入表格标题:");
                if (!title) return;
            
                const description = prompt("请输入分析描述:");
                if (!description) return;
            
                const loading = showLoadingAlert();
            
                try {
                    const reportRequest = {
                        algorithm: "SVM分类",
                        table: {
                            title: title,
                            description: description,
                            data: data,
                            labels: labels,
                            predict_data: predictData,
                            C: C,
                            tol: tol,
                            max_iter: maxIter
                        },
                        analysisResults: {
                            result: {
                                data: responseData.data,
                                probabilities: responseData.probabilities
                            }
                        }
                    };
            
                    console.log("前端传输的数据：", reportRequest);
                    const reportResponse = await fetch("http://127.0.0.1:7077/llm/report", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(reportRequest),
                    });
            
                    if (!reportResponse.ok) {
                        throw new Error(`生成报告失败! 状态码: ${reportResponse.status}`);
                    }
            
                    const reportData = await reportResponse.json();
                    const blob = new Blob([reportData.data], { type: 'text/markdown' });
                    const url = window.URL.createObjectURL(blob);
            
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'analysis_report.md';
                    a.click();
            
                    window.URL.revokeObjectURL(url);
                } catch (error) {
                    console.error('生成报告时出错:', error);
                    alert('生成报告失败: ' + error.message);
                } finally {
                    loading.close(); // 无论成功还是失败，都关闭加载提示
                }
            }
            renderSVMTable(responseData); // 渲染表格
        } else {
            throw new Error("后端返回的数据格式不正确！");
        }
    } catch (error) {
        console.error("操作失败：", error.message);
        alert(`操作失败：${error.message}`);
    }
}

// 渲染返回数据为表格
// 渲染返回数据为表格
function renderSVMTable(responseData) {
    const tableContainer = document.getElementById("tableContainer");

    const { data, probabilities } = responseData;

    // 确保 `data` 和 `probabilities` 格式正确
    if (!Array.isArray(data) || !Array.isArray(probabilities) || probabilities.length < 2) {
        tableContainer.innerHTML = "<p>后端返回的数据格式不正确！</p>";
        console.error("数据格式错误：", responseData);
        return;
    }

    // 确保类别列表和概率数组的长度一致
    const categories = probabilities[0]; // 类别列表
    const predictionProbabilities = probabilities.slice(1); // 去掉类别行

    if (!Array.isArray(categories) || predictionProbabilities.some(prob => !Array.isArray(prob))) {
        tableContainer.innerHTML = "<p>后端返回的类别或概率数据格式不正确！</p>";
        console.error("类别或概率数据错误：", probabilities);
        return;
    }

    // 构建表格
    let tableHtml = "<table border='1' style='width: 100%; border-collapse: collapse;'>";
    tableHtml += "<thead><tr>";
    tableHtml += "<th style='padding: 8px; text-align: left; border: 1px solid #ddd;'>预测值</th>";
    tableHtml += "<th style='padding: 8px; text-align: left; border: 1px solid #ddd;'>类别概率</th>";
    tableHtml += "</tr></thead><tbody>";

    // 渲染每个预测值和对应的概率
    data.forEach((predictedLabel, index) => {
        const probabilitiesForPrediction = predictionProbabilities[index];
        if (!Array.isArray(probabilitiesForPrediction)) {
            console.error(`概率数据不是数组，索引: ${index}, 数据: `, probabilitiesForPrediction);
            return;
        }

        // 组合类别和概率
        const probabilityDetails = categories
            .map((category, i) => `${category}: ${probabilitiesForPrediction[i]?.toFixed(2) || "N/A"}`)
            .join(", ");

        tableHtml += "<tr>";
        tableHtml += `<td style='padding: 8px; text-align: left; border: 1px solid #ddd;'>${predictedLabel}</td>`;
        tableHtml += `<td style='padding: 8px; text-align: left; border: 1px solid #ddd;'>${probabilityDetails}</td>`;
        tableHtml += "</tr>";
    });

    tableHtml += "</tbody></table>";

    // 插入表格
    tableContainer.innerHTML = tableHtml;

    // 创建Excel工作簿
    const ws = XLSX.utils.aoa_to_sheet([
        ["预测值", ...categories],
        ...data.map((predictedLabel, index) => [predictedLabel, ...predictionProbabilities[index].map(p => p.toFixed(2))])
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // 创建Blob对象
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    // 创建下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = 'svm_results.xlsx';
    a.style.display = 'none';

    // 添加到DOM
    document.body.appendChild(a);

    // 提示用户是否下载
    if (confirm('是否要下载SVM分类结果为Excel文件？')) {
        // 模拟点击
        a.click();

        // 清理
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    } else {
        // 用户选择不下载时清理资源
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// 显示随机森林分类模态框
function handleAlgorithmClick7() {
    const modal = document.getElementById("randomForestModal");
    if (!modal) {
        console.error("随机森林模态框不存在！");
        return;
    }
    modal.style.display = "block";
}

// 关闭模态框
function closeRandomForestModal() {
    const modal = document.getElementById("randomForestModal");
    if (modal) {
        modal.style.display = "none";
    }
}

async function submitRandomForestParameters() {
    try {
        // 获取用户输入的参数
        const labelsInput = document.getElementById("labels2").value.trim();
        if (!labelsInput) {
            throw new Error("标签输入框为空，请输入标签！");
        }

        // 将用户输入的标签解析为数组
        const labels = labelsInput.split(",").map(label => label.trim());
        if (labels.length === 0 || labels.some(label => label === "")) {
            throw new Error("解析后的标签数组为空或包含空值，请检查输入！");
        }

        const nEstimators = parseInt(document.getElementById("n_estimators").value);
        const maxDepth = parseInt(document.getElementById("max_depth").value);
        const maxLeafNodes = parseInt(document.getElementById("max_leaf_nodes").value);
        const minSamplesSplit = parseInt(document.getElementById("min_samples_split").value);
        const minSamplesLeaf = parseInt(document.getElementById("min_samples_leaf").value);

        // 验证用户输入
        if (isNaN(nEstimators) || nEstimators <= 0) {
            alert("n_estimators 参数必须是正整数！");
            return;
        }
        if (isNaN(maxDepth) || maxDepth <= 0) {
            alert("max_depth 参数必须是正整数！");
            return;
        }
        if (isNaN(maxLeafNodes) || maxLeafNodes <= 0) {
            alert("max_leaf_nodes 参数必须是正整数！");
            return;
        }
        if (isNaN(minSamplesSplit) || minSamplesSplit <= 0) {
            alert("min_samples_split 参数必须是正整数！");
            return;
        }
        if (isNaN(minSamplesLeaf) || minSamplesLeaf <= 0) {
            alert("min_samples_leaf 参数必须是正整数！");
            return;
        }

        // 从 LocalStorage 获取数据
        const rawData = localStorage.getItem("analysisData");
        if (!rawData) {
            throw new Error("LocalStorage 中未找到键：analysisData");
        }

        const files = JSON.parse(rawData);

        // 提取 data 和 predict_data 列
        const dataFile = files.find(file => file.fileName === "data.xls");
        const predictDataFile = files.find(file => file.fileName === "predict_data.xls");

        if (!dataFile || !predictDataFile) {
            throw new Error("未找到数据文件或预测文件，请检查上传文件！");
        }

        const data = dataFile.data.map(item => [item.x, item.y, item.z]); // 转换为二维数组
        const predictData = predictDataFile.data.map(item => [item.x, item.y, item.z]); // 转换为二维数组

        // 构造请求体
        const requestData = {
            data,
            labels,
            predict_data: predictData,
            n_estimators: nEstimators,
            max_depth: maxDepth,
            max_leaf_nodes: maxLeafNodes,
            min_samples_split: minSamplesSplit,
            min_samples_leaf: minSamplesLeaf
        };

        console.log("发送到后端的数据：", requestData);

        // 发送请求到后端
        const response = await fetch("http://127.0.0.1:7077/analysis/RandomForest", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("后端错误详情：", errorText);
            throw new Error(`HTTP error! 状态码: ${response.status}`);
        }

        const responseData = await response.json();
        console.log("后端返回的数据：", responseData);

        // 检查后端返回数据格式
        if (responseData && Array.isArray(responseData.data) && Array.isArray(responseData.probabilities)) {
            // 关闭模态框
            closeRandomForestModal();
            renderRandomForestTable(responseData); // 渲染表格
            // 修改后的主要代码

            // if (window.confirm("是否需要进行智能分析生成报告？")) {
            //     const title = prompt("请输入表格标题:");
            //     if (!title) return;

            //     const description = prompt("请输入分析描述:");
            //     if (!description) return;

            //     const reportRequest = {
            //         algorithm: "随机森林分类",
            //         table: {
            //             title: title,
            //             description: description,
            //             data: data,
            //             labels: labels,
            //             predict_data: predictData,
            //             n_estimators: nEstimators,
            //             max_depth: maxDepth,
            //             max_leaf_nodes: maxLeafNodes,
            //             min_samples_split: minSamplesSplit,
            //             min_samples_leaf: minSamplesLeaf
            //         },
            //         analysisResults: {
            //             result: {
            //                 data: responseData.data,
            //                 probabilities: responseData.probabilities
            //             }
            //         }
            //     };

            //     console.log("前端传输的数据：", reportRequest);
            //     const reportResponse = await fetch("http://127.0.0.1:7077/llm/report", {
            //         method: "POST",
            //         headers: { "Content-Type": "application/json" },
            //         body: JSON.stringify(reportRequest),
            //     });

            //     if (!reportResponse.ok) {
            //         throw new Error(`生成报告失败! 状态码: ${reportResponse.status}`);
            //     }

            //     const reportData = await reportResponse.json();
            //     const blob = new Blob([reportData.data], { type: 'text/markdown' });
            //     const url = window.URL.createObjectURL(blob);

            //     const a = document.createElement('a');
            //     a.href = url;
            //     a.download = 'analysis_report.md';
            //     a.click();

            //     window.URL.revokeObjectURL(url);
            // }
            if (window.confirm("是否需要进行智能分析生成报告？")) {
                const title = prompt("请输入表格标题:");
                if (!title) return;
            
                const description = prompt("请输入分析描述:");
                if (!description) return;
            
                const loading = showLoadingAlert();
            
                try {
                    const reportRequest = {
                        algorithm: "随机森林分类",
                        table: {
                            title: title,
                            description: description,
                            data: data,
                            labels: labels,
                            predict_data: predictData,
                            n_estimators: nEstimators,
                            max_depth: maxDepth,
                            max_leaf_nodes: maxLeafNodes,
                            min_samples_split: minSamplesSplit,
                            min_samples_leaf: minSamplesLeaf
                        },
                        analysisResults: {
                            result: {
                                data: responseData.data,
                                probabilities: responseData.probabilities
                            }
                        }
                    };
            
                    console.log("前端传输的数据：", reportRequest);
                    const reportResponse = await fetch("http://127.0.0.1:7077/llm/report", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(reportRequest),
                    });
            
                    if (!reportResponse.ok) {
                        throw new Error(`生成报告失败! 状态码: ${reportResponse.status}`);
                    }
            
                    const reportData = await reportResponse.json();
                    const blob = new Blob([reportData.data], { type: 'text/markdown' });
                    const url = window.URL.createObjectURL(blob);
            
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'analysis_report.md';
                    a.click();
            
                    window.URL.revokeObjectURL(url);
                } catch (error) {
                    console.error('生成报告时出错:', error);
                    alert('生成报告失败: ' + error.message);
                } finally {
                    loading.close(); // 无论成功还是失败，都关闭加载提示
                }
            }

            // 提示用户是否下载Excel文件
            if (confirm('是否要下载预测结果为Excel文件？')) {
                downloadExcelFile(responseData);
            }

        } else {
            throw new Error("后端返回的数据格式不正确！");
        }
    } catch (error) {
        console.error("操作失败：", error.message);
        alert(`操作失败：${error.message}`);
    }
}

// 创建并下载Excel文件
function downloadExcelFile(responseData) {
    const { data, probabilities } = responseData;

    // 打印 probabilities 结构以供调试
    console.log("probabilities 数据结构:", probabilities);

    // 检查 probabilities 的结构
    if (!Array.isArray(probabilities) || probabilities.length < 2) {
        throw new Error("probabilities 格式不正确，至少应为两个数组组成的数组");
    }

    const labels = probabilities[0]; // 类别名称
    const probs = probabilities.slice(1); // 概率数组

    // 确保 labels 是一个数组
    if (!Array.isArray(labels)) {
        throw new Error("probabilities[0] 应该是一个数组");
    }

    // 确保 probs 中的每个元素都是数组
    if (probs.some(item => !Array.isArray(item))) {
        throw new Error("probabilities 中的每个元素应该是数组");
    }

    // 创建工作簿对象
    const ws = XLSX.utils.aoa_to_sheet([
        ["预测值", ...labels], // 添加类别作为列头
        ...data.map((predictedLabel, index) => [predictedLabel, ...probs[index].map(prob => prob.toFixed(2))]) // 添加数据行
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // 创建Blob对象
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    // 创建下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = 'random_forest_results.xlsx';
    a.style.display = 'none';

    // 添加到DOM
    document.body.appendChild(a);

    // 模拟点击
    a.click();

    // 清理
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}
// 渲染返回数据为表格
function renderRandomForestTable(responseData) {
    const tableContainer = document.getElementById("tableContainer");

    const { data, probabilities } = responseData;

    if (!Array.isArray(data) || !Array.isArray(probabilities)) {
        tableContainer.innerHTML = "<p>后端返回的数据格式不正确！</p>";
        return;
    }

    // 构建表格
    let tableHtml = "<table border='1' style='width: 100%; border-collapse: collapse;'>";
    tableHtml += "<thead><tr>";
    tableHtml += "<th style='padding: 8px; text-align: left; border: 1px solid #ddd;'>预测值</th>";
    tableHtml += "<th style='padding: 8px; text-align: left; border: 1px solid #ddd;'>类别概率</th>";
    tableHtml += "</tr></thead><tbody>";

    data.forEach((predictedLabel, index) => {
        tableHtml += "<tr>";
        tableHtml += `<td style='padding: 8px; text-align: left; border: 1px solid #ddd;'>${predictedLabel}</td>`;
        tableHtml += `<td style='padding: 8px; text-align: left; border: 1px solid #ddd;'>${probabilities[1]
            .map((prob, i) => `${probabilities[0][i]}: ${prob.toFixed(2)}`)
            .join(", ")}</td>`;
        tableHtml += "</tr>";
    });

    tableHtml += "</tbody></table>";

    // 插入表格
    tableContainer.innerHTML = tableHtml;
}