// 打开弹窗并填充列数据
function showAxisSelectPopup(operation) {
  currentOperation = operation; // 记录当前操作
  // 获取弹窗和下拉框元素
  const axisSelectPopup = document.getElementById("axisSelectPopup");
  const xAxisSelect = document.getElementById("xAxisSelect");
  const yAxisSelect = document.getElementById("yAxisSelect");
  const confirmButton = document.getElementById("confirmAxisSelection");
  // 获取列名，假设 analysisData[0] 是数据的第一行
  const columns = Object.keys(analysisData[0].data[0]); // 获取第一个数据对象的键
  // 清空选择框内容并重新填充
  xAxisSelect.innerHTML = '<option value="">请选择</option>';
  yAxisSelect.innerHTML = '<option value="">请选择</option>';
  columns.forEach((column) => {
    const optionX = document.createElement("option");
    optionX.value = column;
    optionX.textContent = column;
    xAxisSelect.appendChild(optionX);
    const optionY = document.createElement("option");
    optionY.value = column;
    optionY.textContent = column;
    yAxisSelect.appendChild(optionY);
  });
  // 启用确认按钮（如果两个选项都有选择）
  toggleConfirmButton();
  // 显示弹窗
  axisSelectPopup.style.display = "flex";
}

// 关闭弹窗
function closeAxisSelectPopup() {
  console.log("Closing popup...");
  const axisSelectPopup = document.getElementById("axisSelectPopup");
  axisSelectPopup.style.display = "none";
}

// 确认选择的列并展示图表
function applyAxisSelection() {
  const xAxisSelect = document.getElementById("xAxisSelect");
  const yAxisSelect = document.getElementById("yAxisSelect");
  const xAxisColumn = xAxisSelect.value;
  const yAxisColumn = yAxisSelect.value;
  console.log("xAxisColumn:", xAxisColumn, "yAxisColumn:", yAxisColumn); // 查看选择的列
  if (!xAxisColumn || !yAxisColumn) {
    alert("请同时选择 X 轴和 Y 轴的列");
    return;
  }
  // 调用函数显示图表
  console.log("准备显示图表...");
  if (currentOperation === "displayLine") {
    displayLineChart(xAxisColumn, yAxisColumn); // 生成折线图
  } else if (currentOperation === "displayPie") {
    displayPieChart(xAxisColumn, yAxisColumn); // 生成饼图
  } else if (currentOperation === "displayBar") {
    displayBarChart(xAxisColumn, yAxisColumn); // 生成柱状图
  } else if (currentOperation === "displayLineBarMixed") {
    displayLineBarMixedChart(xAxisColumn, yAxisColumn); // 生成折线柱状混合图
  }
  // 关闭弹窗
  console.log("准备关闭弹窗...");
  closeAxisSelectPopup();
}

document.addEventListener("DOMContentLoaded", function () {
  // 现在保证页面完全加载后才执行事件绑定
  const xAxisSelect = document.getElementById("xAxisSelect");
  const yAxisSelect = document.getElementById("yAxisSelect");
  if (xAxisSelect && yAxisSelect) {
    xAxisSelect.addEventListener("change", toggleConfirmButton);
    yAxisSelect.addEventListener("change", toggleConfirmButton);
  }
  // 初始状态检查确认按钮是否可用
  toggleConfirmButton();
});

// 启用或禁用确认按钮
function toggleConfirmButton() {
  const xAxisSelect = document.getElementById("xAxisSelect");
  const yAxisSelect = document.getElementById("yAxisSelect");
  const confirmButton = document.getElementById("confirmAxisSelection");
  if (confirmButton) {
    // 确保 confirmButton 不为 null
    // 如果两个下拉框都选择了列，启用确认按钮
    if (xAxisSelect.value && yAxisSelect.value) {
      confirmButton.disabled = false;
    } else {
      confirmButton.disabled = true;
    }
  }
}

// 绘制图表的函数
function displayLineChart(xAxisColumn, yAxisColumn) {
  const fileData = analysisData[0].data;
  if (!fileData || fileData.length === 0) {
    console.error("无效的 analysisData 数据");
    return;
  }
  // 确保 x 和 y 轴的列名在 headers 中
  const headers = Object.keys(fileData[0]); // 获取列名
  if (!headers.includes(xAxisColumn) || !headers.includes(yAxisColumn)) {
    console.error(`列名 ${xAxisColumn} 或 ${yAxisColumn} 不存在于数据中`);
    return;
  }
  // 构建请求数据
  const requestData = {
    title: "Sample Line Chart",
    xAxisLabel: xAxisColumn,
    yAxisLabel: yAxisColumn,
    data: fileData.map((row) => {
      return {
        x: row[xAxisColumn], // 使用选择的列作为 x 轴数据
        y: row[yAxisColumn], // 使用选择的列作为 y 轴数据
      };
    }),
  };
  // 打印请求数据，调试用
  console.log("请求数据:", requestData);
  // 发送 POST 请求到后端
  fetch("http://127.0.0.1:7077/chart/line", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data); // 打印数据以调试
      // 检查返回的数据是否包含 image 和 message
      if (data && data.message === "success" && data.image) {
        const base64Image = data.image;
        // 打印 base64Image 看是否正确
        console.log("Base64 Image:", base64Image);
        // 显示弹窗并插入图片
        showImageInModal(base64Image);
      } else {
        console.error("后端返回的数据格式不正确", data);
      }
    })
    .catch((error) => {
      console.error("请求失败:", error);
    });
}

function displayPieChart(xAxisColumn, yAxisColumn) {
  const fileData = analysisData[0].data;
  if (!fileData || fileData.length === 0) {
    console.error("无效的 analysisData 数据");
    return;
  }
  // 确保 x 和 y 轴的列名在 headers 中
  const headers = Object.keys(fileData[0]); // 获取列名
  if (!headers.includes(xAxisColumn) || !headers.includes(yAxisColumn)) {
    console.error(`列名 ${xAxisColumn} 或 ${yAxisColumn} 不存在于数据中`);
    return;
  }
  // 构建请求数据
  const requestData = {
    title: "Sample Pie Chart",
    xAxisLabel: xAxisColumn,
    yAxisLabel: yAxisColumn,
    data: fileData.map((row) => {
      return {
        name: String(row[xAxisColumn]), // 使用选择的列作为 x 轴数据
        value: row[yAxisColumn], // 使用选择的列作为 y 轴数据
      };
    }),
  };
  // 打印请求数据，调试用
  console.log("请求数据:", requestData);
  // 发送 POST 请求到后端
  fetch("http://127.0.0.1:7077/chart/pie", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json()) // 解析 JSON 响应
    .then((data) => {
      console.log("后端返回的数据:", JSON.stringify(data, null, 2));
      // 检查 data.image 是否有效
      if (
        data &&
        data.image &&
        typeof data.image === "string" &&
        data.image.length > 0
      ) {
        const base64Image = data.image; // 获取 Base64 数据
        showImageInModal(base64Image); // 显示图片
      } else {
        console.error("后端返回的数据格式不正确", data);
      }
    })
    .catch((error) => {
      console.error("请求失败:", error);
    });
}

function displayBarChart(xAxisColumn, yAxisColumn) {
  const fileData = analysisData[0].data;
  if (!fileData || fileData.length === 0) {
    console.error("无效的 analysisData 数据");
    return;
  }
  // 确保 x 和 y 轴的列名在 headers 中
  const headers = Object.keys(fileData[0]); // 获取列名
  if (!headers.includes(xAxisColumn) || !headers.includes(yAxisColumn)) {
    console.error(`列名 ${xAxisColumn} 或 ${yAxisColumn} 不存在于数据中`);
    return;
  }
  // 构建请求数据
  const requestData = {
    title: "Sample Bar Chart",
    xAxisLabel: xAxisColumn,
    yAxisLabel: yAxisColumn,
    data: fileData.map((row) => {
      return {
        label: String(row[xAxisColumn]), // 使用选择的列作为 x 轴数据
        value: row[yAxisColumn], // 使用选择的列作为 y 轴数据
      };
    }),
  };
  // 打印请求数据，调试用
  console.log("请求数据:", requestData);
  // 发送 POST 请求到后端
  fetch("http://127.0.0.1:7077/chart/bar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data); // 打印数据以调试

      // 检查返回的数据是否包含 image 和 message
      if (data && data.message === "success" && data.image) {
        // 获取返回的 base64 编码图片
        const base64Image = data.image;
        // 打印 base64Image 看是否正确
        console.log("Base64 Image:", base64Image);
        // 显示弹窗并插入图片
        showImageInModal(base64Image);
      } else {
        console.error("后端返回的数据格式不正确", data);
      }
    })
    .catch((error) => {
      console.error("请求失败:", error);
    });
}

function displayLineBarMixedChart(xAxisColumn, yAxisColumn) {
  const fileData = analysisData[0].data;
  if (!fileData || fileData.length === 0) {
    console.error("无效的 analysisData 数据");
    return;
  }
  // 确保 x 和 y 轴的列名在 headers 中
  const headers = Object.keys(fileData[0]); // 获取列名
  if (!headers.includes(xAxisColumn) || !headers.includes(yAxisColumn)) {
    console.error(`列名 ${xAxisColumn} 或 ${yAxisColumn} 不存在于数据中`);
    return;
  }
  // 构建请求数据
  const requestData = {
    title: "Sample Mixed Chart",
    xAxisLabel: xAxisColumn,
    yAxisLabel: yAxisColumn,
    line_data: fileData.map((row) => {
      return {
        x: row[xAxisColumn], // 使用选择的列作为 x 轴数据
        y: row[yAxisColumn], // 使用选择的列作为 y 轴数据
      };
    }),
    bar_data: fileData.map((row) => {
      return {
        label: String(row[xAxisColumn]), // 使用选择的列作为 x 轴数据
        value: row[yAxisColumn], // 使用选择的列作为 y 轴数据
      };
    }),
  };
  // 打印请求数据，调试用
  console.log("请求数据:", requestData);
  // 发送 POST 请求到后端
  fetch("http://127.0.0.1:7077/chart/linebarmixed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data); // 打印数据以调试
      // 检查返回的数据是否包含 image 和 message
      if (data && data.message === "success" && data.image) {
        // 获取返回的 base64 编码图片
        const base64Image = data.image;
        // 打印 base64Image 看是否正确
        console.log("Base64 Image:", base64Image);
        // 显示弹窗并插入图片
        showImageInModal(base64Image);
      } else {
        console.error("后端返回的数据格式不正确", data);
      }
    })
    .catch((error) => {
      console.error("请求失败:", error);
    });
}

// 显示图表图片的函数
function showImageInModal(base64Image) {
  const content1 = document.querySelector(".content1");
  const content1Rect = content1.getBoundingClientRect();
  const modalWidth = 640; // 弹窗的宽度
  const modalHeight = 500; // 弹窗的高度
  
  const modal = document.createElement("div");
  modal.style.position = "absolute"; // 使用绝对定位来将其定位到 content1 的位置
  modal.style.width = `${modalWidth}px`;
  modal.style.height = `${modalHeight}px`;
  modal.style.backgroundColor = "white";
  modal.style.padding = "20px";
  modal.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.3)";
  modal.style.borderRadius = "15px";
  modal.style.zIndex = "1000";
  modal.style.boxSizing = "border-box";
  modal.style.display = "flex";
  modal.style.flexDirection = "column";
  modal.style.justifyContent = "space-between";
  const imageElement = document.createElement("img");
  imageElement.src = `data:image/png;base64,${base64Image}`;
  imageElement.alt = "Line Chart";
  imageElement.style.maxWidth = "100%";
  imageElement.style.maxHeight = "100%";
  imageElement.style.objectFit = "contain";
  
  // 将图片添加到弹窗中
  modal.appendChild(imageElement);
  // 下载按钮
  const downloadButton = document.createElement("button");
  downloadButton.textContent = "下载图片";
  downloadButton.style.padding = "8px 16px";
  downloadButton.style.display = "flex";
  downloadButton.style.alignItems = "center";
  downloadButton.style.justifyContent = "center";
  downloadButton.onclick = function () {
    downloadImage(base64Image);
  };

  // 关闭按钮
  const closeButton = document.createElement("button");
  closeButton.textContent = "关闭";
  closeButton.style.padding = "8px 16px";
  closeButton.style.display = "flex";
  closeButton.style.alignItems = "center";
  closeButton.style.justifyContent = "center";
  closeButton.onclick = function () {
    modal.remove();
  };

  // 按钮容器
  const buttonContainer = document.createElement("div");
  buttonContainer.style.display = "flex";
  buttonContainer.style.justifyContent = "center"; 
  buttonContainer.style.width = "100%";
  buttonContainer.style.marginTop = "-20px";
  buttonContainer.style.flexDirection = "row";
  // 将按钮添加到按钮容器
  buttonContainer.appendChild(downloadButton);
  buttonContainer.appendChild(closeButton);

  // 将按钮容器添加到弹窗中
  modal.appendChild(buttonContainer);

  const modalTop = content1Rect.top + window.scrollY + (content1Rect.height - modalHeight) / 2;
  const modalLeft = content1Rect.left + window.scrollX + (content1Rect.width - modalWidth) / 2;
  modal.style.top = `${modalTop}px`;
  modal.style.left = `${modalLeft}px`;

  // 将弹窗添加到页面中
  document.body.appendChild(modal);
}