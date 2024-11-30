let currentOperation = ''; // 标记当前操作是哪种处理算法
let selectedColumns = [];  // 用于存储用户选择的列名
let newAnalysisDataJSON = ''; // 定义全局变量

document.addEventListener('DOMContentLoaded', function () {
    const confirmButton = document.getElementById('confirmColumnSelection');
    if (confirmButton) {
        confirmButton.disabled = true;  // 初始化时禁用确认按钮
    }
});
function openColumnSelectPopup(operation) {
    currentOperation = operation;  // 记录当前操作
    const columnSelectPopup = document.getElementById('columnSelectPopup');
    const columnList = document.getElementById('columnList');
    // 获取 analysisData 中的列名
    const columns = Object.keys(analysisData[0].data[0]); // 获取第一个数据对象的键
    // 清空列表并显示列名
    columnList.innerHTML = '';
    columns.forEach(column => {
        const li = document.createElement('li');
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" name="column" value="${column}"> ${column}`;
        li.appendChild(label);
        columnList.appendChild(li);
    });
    // 显示弹窗
    columnSelectPopup.style.display = 'flex';
    // 移除之前的事件监听器
    columnList.removeEventListener('change', columnListChangeHandler);
    // 监听列选择变化
    columnList.addEventListener('change', columnListChangeHandler);
    function columnListChangeHandler() {
        selectedColumns = Array.from(document.querySelectorAll('input[name="column"]:checked')).map(input => input.value);
        updateAvailableOperations();
    }
    // 更新可用操作和选择限制
    function updateAvailableOperations() {
        let minSelection = 1;
        if (currentOperation === 'standardize' || currentOperation === 'handleOutliers' || currentOperation === 'handleMissingValues') {
            minSelection = 1;
        } else if (currentOperation === 'handleFeatureCorrelation' || currentOperation === 'handleFeatureVariance' || currentOperation === 'handleFeatureChiSquare') {
            minSelection = 2;
        }

        const confirmButton = document.getElementById('confirmColumnSelection');
        if (selectedColumns.length >= minSelection) {
            confirmButton.disabled = false;
        } else {
            confirmButton.disabled = true;
        }
    }
}
// 确认用户选择的列
function confirmColumnSelection() {
    if (selectedColumns.length === 0) {
        alert('请先选择至少一个列');
        return;
    }
    // 根据当前操作选择执行的函数
    if (currentOperation === 'standardize' && selectedColumns.length === 1) {
        standardizeData(); // 单列标准化操作
    } else if (currentOperation === 'handleOutliers' && selectedColumns.length === 1) {
        handleOutliers(); // 单列异常值处理
    } else if (currentOperation === 'handleMissingValues' && selectedColumns.length === 1) {
        missingValuesHandleData(); // 单列缺失值处理
    } else if (currentOperation === 'handleFeatureCorrelation' && selectedColumns.length > 1) {
        handleFeatureCorrelation(); // 多列特征相关性矩阵
    } else if (currentOperation === 'handleFeatureVariance' && selectedColumns.length > 1) {
        handleFeatureVariance(); // 多列特征方差
    } else if (currentOperation === 'handleFeatureChiSquare' && selectedColumns.length > 1) {
        handleFeatureChiSquare(); // 多列卡方检验
    }
    closeColumnSelectPopup(); // 关闭列选择弹窗
}
// 关闭列选择弹窗
function closeColumnSelectPopup() {
    const columnSelectPopup = document.getElementById('columnSelectPopup');
    columnSelectPopup.style.display = 'none'; // 隐藏弹窗
}
// 获取所选列的数据，并转换为二维数组
function getSelectedColumnData() {
    const fileData = analysisData[0].data;
    // 提取选中的列数据
    const selectedData = selectedColumns.map(column => {
        return fileData.map(row => row[column]);
    });

    // 返回的数据结构应符合后端要求
    return {
        data: selectedData
    };
}
// 发送请求获取标准化处理结果
function standardizeData() {
    // 获取选中的列的索引或名称
    const columnIndex = selectedColumns[0];  // 假设只选择了一个列
    const fileData = analysisData[0].data;
    console.log('Success:', analysisData[0].data);
    // 提取要标准化的列数据（假设 analysisData 是二维数组）
    const dataToSend = {
        data: fileData.map(row => row[columnIndex]) // 提取该列的数据
    };
    // 发送请求到后端
    fetch('http://127.0.0.1:7077/dataProcessing/standardize', { // 替换为你的后端 API 地址
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend), // 将数据转换为 JSON 格式
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            // 检查后端返回的数据格式是否正确
            if (data && data.message === 'success') {
                // 替换原始数据中的列
                const standardizedData = data.data;
                const newAnalysisData = fileData.map((row, index) => {
                    const newRow = { ...row }; // 创建原始行数据的副本
                    newRow[columnIndex] = standardizedData[index]; // 替换为标准化后的数据
                    return newRow;
                });
                console.log('Success:', newAnalysisData);
                // 生成新的 JSON 数据
                newAnalysisDataJSON = JSON.stringify(newAnalysisData);
                analysisData[0].data = newAnalysisData;
                renderAllTables(analysisData);
                localStorage.setItem('analysisData', JSON.stringify(analysisData));

                showPopup(newAnalysisDataJSON); // 显示标准化后的结果
                
            } else {
                alert('标准化失败: ' + (data.message || '未知错误'));
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('请求失败，请稍后再试！');
        });
}
// 发送请求获取异常值处理结果
function handleOutliers() {
    if (selectedColumns.length === 0) {
        alert('没有选择要标准化的列');
        return;
    }
    // 获取选中的列的索引或名称
    const columnIndex = selectedColumns[0];  // 假设只选择了一个列
    const fileData = analysisData[0].data;
    // 提取要标准化的列数据（假设 analysisData 是二维数组）
    const dataToSend = {
        data: fileData.map(row => row[columnIndex]) // 提取该列的数据
    };
    // 使用 fetch 请求与后端进行交互
    fetch('http://127.0.0.1:7077/dataProcessing/outliers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'  // 确保接收到 JSON 格式的数据
        },
        body: JSON.stringify(dataToSend)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            if (data && data.message === 'success') {
                // 替换原始数据中的列
                const handleOutliersData = data.data;
                const newAnalysisData = fileData.map((row, index) => {
                    const newRow = { ...row }; // 创建原始行数据的副本
                    newRow[columnIndex] = handleOutliersData[index]; // 替换为标准化后的数据
                    return newRow;
                });
                // 生成新的 JSON 数据
                newAnalysisDataJSON = JSON.stringify(newAnalysisData);
                analysisData[0].data = newAnalysisData;
                renderAllTables(analysisData);
                showOutliersPopup(newAnalysisDataJSON);
                localStorage.setItem('analysisData', JSON.stringify(analysisData));
            } else {
                alert("处理异常值失败: " + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert("发生错误，请稍后再试！");
        });
}
// 发送请求获取缺失值处理结果
function missingValuesHandleData() {
    if (selectedColumns.length === 0) {
        alert('没有选择要标准化的列');
        return;
    }
    const columnIndex = selectedColumns[0];  // 假设只选择了一个列
    // 获取选中的列的索引或名称
    const fileData = analysisData[0].data;
    // 提取要标准化的列数据（假设 analysisData 是二维数组）
    const dataToSend = {
        data: fileData.map(row => row[columnIndex]) // 提取该列的数据
    };
    // 使用 fetch 请求与后端进行交互
    fetch('http://127.0.0.1:7077/dataProcessing/missing', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'  // 确保接收到 JSON 格式的数据
        },
        body: JSON.stringify(dataToSend)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            if (data && data.message === 'success') {
                const missingValuesData = data.data;
                const newAnalysisData = fileData.map((row, index) => {
                    const newRow = { ...row }; // 创建原始行数据的副本
                    newRow[columnIndex] = missingValuesData[index]; // 替换为标准化后的数据
                    return newRow;
                });
                analysisData[0].data = newAnalysisData;
                renderAllTables(analysisData);
                // 生成新的 JSON 数据
                newAnalysisDataJSON = JSON.stringify(newAnalysisData);
                showMissingValuesPopup(newAnalysisDataJSON);
                localStorage.setItem('analysisData', JSON.stringify(analysisData));
            } else {
                alert("处理缺失值失败: " + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert("发生错误，请稍后再试！");
        });
}
// 发送请求获取特征相关性矩阵
function handleFeatureCorrelation() {
    const inputData = getSelectedColumnData();
    // 使用 fetch 请求与后端进行交互
    fetch('http://127.0.0.1:7077/dataProcessing/feature/correlation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(inputData)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            if (data && data.message === 'success') {
                // 处理返回的相关性矩阵数据
                showFeatureCorrelationPopup(data.data); // 显示弹窗并展示数据
            } else {
                alert("计算特征相关性失败: " + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert("发生错误，请稍后再试！");
        });
}
// 发送请求进行卡方检验
function handleFeatureChiSquare() {
    const inputData = getSelectedColumnData();
    // 使用 fetch 请求与后端进行交互
    fetch('http://127.0.0.1:7077/dataProcessing/feature/chi_square', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(inputData)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            if (data && data.message === 'success') {
                // 处理返回的卡方检验结果
                showChiSquarePopup(data.data); // 显示弹窗并展示数据
            } else {
                alert("计算卡方检验失败: " + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert("发生错误，请稍后再试！");
        });
}
// 发送请求获取特征方差
function handleFeatureVariance() {
    const inputData = getSelectedColumnData();
    // 使用 AJAX 请求与后端进行交互
    fetch('http://127.0.0.1:7077/dataProcessing/feature/variance', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(inputData)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            if (data && data.message === 'success') {
                // 处理返回的方差数据
                showFeatureVariancePopup(data.data); // 显示弹窗并展示数据
            } else {
                alert("计算特征方差失败: " + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert("发生错误，请稍后再试！");
        });
}
// function renderDataTable(data) {
//     if (data && data.length > 0) {
//         let tableHtml = '<table><thead><tr>';
//         const tableDataContainer = document.getElementById('tableDataContainer');
//         // 获取表头
//         Object.keys(data[0]).forEach(key => {
//             tableHtml += `<th>${key}</th>`;
//         });
//         tableHtml += '</tr></thead><tbody>';

//         // 获取表格内容
//         data.forEach(row => {
//             tableHtml += '<tr>';
//             Object.values(row).forEach(value => {
//                 tableHtml += `<td>${value}</td>`;
//             });
//             tableHtml += '</tr>';
//         });

//         tableHtml += '</tbody></table>';
//         tableDataContainer.innerHTML = tableHtml;
//     } else {
//         tableDataContainer.innerHTML = '<p>暂无数据</p>';
//     }
// }
function renderDataTable(data, containerId) {
    if (data && data.length > 0) {
        let tableHtml = '<table><thead><tr>';
        const tableDataContainer = document.getElementById(containerId);
        // 获取表头
        Object.keys(data[0]).forEach(key => {
            tableHtml += `<th>${key}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';

        // 获取表格内容
        data.forEach(row => {
            tableHtml += '<tr>';
            Object.values(row).forEach(value => {
                tableHtml += `<td>${value}</td>`;
            });
            tableHtml += '</tr>';
        });

        tableHtml += '</tbody></table>';
        tableDataContainer.innerHTML = tableHtml;
    } else {
        tableDataContainer.innerHTML = '<p>暂无数据</p>';
    }
}
// 下载表格数据为 CSV 文件
function downloadData() {
    console.log('newAnalysisDataJSON:', newAnalysisDataJSON);
    const dataToDownload = JSON.parse(newAnalysisDataJSON);
    if (typeof newAnalysisDataJSON === 'undefined' || !newAnalysisDataJSON) {
        alert('没有可下载的数据！');
        return;
    }
    if (!dataToDownload || !Array.isArray(dataToDownload)) {
        alert('没有可下载的数据！');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,\ufeff"; // 添加 BOM 以支持 UTF-8 编码
    // 添加表头
    const headers = Object.keys(dataToDownload[0]).join(",");
    csvContent += headers + "\r\n";
    // 添加数据行
    dataToDownload.forEach(row => {
        const rowArray = Object.values(row).map(value => {
            // 为每个字段添加引号，避免逗号分隔符问题，并处理可能的换行符
            const valueString = (value === null || value === undefined) ? 'null' : value.toString();
            return `"${valueString.replace(/"/g, '""').replace(/\n/g, " ")}"`;
        });
        csvContent += rowArray.join(",") + "\r\n";
    });

    // 创建隐藏的下载链接
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
// // 显示标准化后的结果
// function showPopup(newAnalysisDataJSON) {
//     const newAnalysisData = JSON.parse(newAnalysisDataJSON);
//     renderDataTable(newAnalysisData); // 调用 renderTable 函数来显示表格

//     const popup = document.getElementById('standardizationPopup');
//     popup.style.display = 'flex';  // 显示弹窗
// }
// // 显示处理异常值后的结果
// function showOutliersPopup(newAnalysisDataJSON) {
//     const newAnalysisData = JSON.parse(newAnalysisDataJSON);
//     console.log('解析后的数据:', newAnalysisData); // 添加调试日志
//     renderDataTable(newAnalysisData); // 调用 renderTable 函数来显示表格

//     const popup = document.getElementById('standardizationPopup');
//     popup.style.display = 'flex';  // 显示弹窗
// }
// // 显示处理缺失值后的结果
// function showMissingValuesPopup(newAnalysisDataJSON) {
//     const newAnalysisData = JSON.parse(newAnalysisDataJSON);
//     console.log('解析后的数据:', newAnalysisData); // 添加调试日志
//     renderDataTable(newAnalysisData); // 调用 renderTable 函数来显示表格

//     const popup = document.getElementById('missingValuesResultPopup');
//     popup.style.display = 'flex'; // 显示弹窗
// }
// 显示标准化后的结果
function showPopup(newAnalysisDataJSON) {
    const newAnalysisData = JSON.parse(newAnalysisDataJSON);
    renderDataTable(newAnalysisData, 'standardizationTableDataContainer'); // 指定对应的容器 ID

    const popup = document.getElementById('standardizationPopup');
    popup.style.display = 'flex';  // 显示弹窗
}

// 显示处理异常值后的结果
function showOutliersPopup(newAnalysisDataJSON) {
    const newAnalysisData = JSON.parse(newAnalysisDataJSON);
    renderDataTable(newAnalysisData, 'outliersTableDataContainer'); // 指定对应的容器 ID

    const popup = document.getElementById('outliersResultPopup');
    popup.style.display = 'flex';  // 显示弹窗
}

// 显示处理缺失值后的结果
function showMissingValuesPopup(newAnalysisDataJSON) {
    const newAnalysisData = JSON.parse(newAnalysisDataJSON);
    renderDataTable(newAnalysisData, 'missingValuesTableDataContainer'); // 指定对应的容器 ID

    const popup = document.getElementById('missingValuesResultPopup');
    popup.style.display = 'flex'; // 显示弹窗
}
// 显示弹窗并展示相关性矩阵数据
function showFeatureCorrelationPopup(correlationMatrix) {
    const resultArea = document.getElementById('featureCorrelationResult');
    const formattedMatrix = correlationMatrix.map(row => `[${row.join(', ')}],`).join('\n');

    resultArea.textContent = formattedMatrix;

    const popup = document.getElementById('featureCorrelationResultPopup');
    popup.style.display = 'flex'; // 显示弹窗
}
// 显示弹窗并展示卡方检验结果
function showChiSquarePopup(chiSquareMatrix) {
    const resultArea = document.getElementById('chiSquareResult');
    const formattedVariances = chiSquareMatrix.map(row => `[${row.join(', ')}],`).join('\n');

    resultArea.textContent = formattedVariances;

    const popup = document.getElementById('chiSquareResultPopup');
    popup.style.display = 'flex'; // 显示弹窗
}
// 显示弹窗并展示方差数据
function showFeatureVariancePopup(variances) {
    const resultArea = document.getElementById('featureVarianceResult');
    const formattedVariances = variances.join('\n');
    resultArea.textContent = formattedVariances;

    const popup = document.getElementById('featureVarianceResultPopup');
    popup.style.display = 'flex'; // 显示弹窗
}
// 关闭弹窗
function closePopup() {
    const standardizationPopup = document.getElementById('standardizationPopup');
    const outliersResultPopup = document.getElementById('outliersResultPopup');
    const missingValuesResultPopup = document.getElementById('missingValuesResultPopup');
    const featureCorrelationResultPopup = document.getElementById('featureCorrelationResultPopup');
    const chiSquareResultPopup = document.getElementById('chiSquareResultPopup');
    const featureVarianceResultPopup = document.getElementById('featureVarianceResultPopup');
    standardizationPopup.style.display = 'none';  // 隐藏标准化结果弹窗
    outliersResultPopup.style.display = 'none';  // 隐藏异常值处理结果弹窗
    missingValuesResultPopup.style.display = 'none'; // 隐藏缺失值处理结果弹窗
    featureCorrelationResultPopup.style.display = 'none'; // 隐藏相关性矩阵结果弹窗
    chiSquareResultPopup.style.display = 'none'; // 隐藏卡方检验结果弹窗
    featureVarianceResultPopup.style.display = 'none'; // 隐藏特征方差结果弹窗
}