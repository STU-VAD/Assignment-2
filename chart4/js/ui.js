/**
 * 界面交互管理模块 (DOM UI & 精简交互)
 * 仅保留错误指示模态窗显示和行政区划下拉框动态渲染等解耦逻辑。
 */
export const UIManager = {
    /**
     * 展现高颜值的数据加载失败模态弹窗
     * @param {string} htmlContent 错误提示的具体 HTML 格式文案描述
     */
    showErrorModal(htmlContent) {
        const modal = document.getElementById("error-modal");
        const desc = document.getElementById("error-desc");
        if (modal) {
            modal.classList.add("active");
        }
        if (desc) {
            desc.innerHTML = htmlContent;
        }
    },

    /**
     * 关闭数据加载错误弹窗
     */
    hideErrorModal() {
        const modal = document.getElementById("error-modal");
        if (modal) {
            modal.classList.remove("active");
        }
    },

    /**
     * 初始化并填充州筛选下拉菜单
     * @param {Set<string>|Array<string>} stateSet 州名称集合描述
     */
    populateStateSelect(stateSet) {
        const select = document.getElementById("state-select");
        if (!select) return;

        // 清空除默认“全部 (All)”外的现有可选项
        while (select.options.length > 1) {
            select.remove(1);
        }

        // 按字母升序依次构建 option 挂载
        Array.from(stateSet).sort().forEach(state => {
            const option = document.createElement("option");
            option.value = state;
            option.textContent = state;
            select.appendChild(option);
        });
    }
};
