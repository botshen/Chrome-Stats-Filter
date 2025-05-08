import { Base64 } from 'js-base64';

export default defineContentScript({
  matches: ['*://*.chrome-stats.com/*'],
  main() {
    // 封装删除元素的逻辑为函数
    const removeElements = () => {
      // 注入按钮
      const table = document.querySelector('table');
      if (table) {
        // 检查是否已经存在我们的按钮，避免重复注入
        const existingButton = document.querySelector('#custom-action-btn');
        const existingClearButton = document.querySelector('#clear-filters-btn');
        const existingPrevButton = document.querySelector('#prev-page-btn');

        if (!existingButton) {
          const buttonContainer = document.createElement('div');
          buttonContainer.style.cssText = 'display: flex; gap: 0.5rem; margin-top: 1rem;';

          // 创建上一页按钮
          const prevButton = document.createElement('button');
          prevButton.id = 'prev-page-btn';
          prevButton.className = 'btn btn-primary';
          prevButton.textContent = 'Previous Page';
          prevButton.onclick = () => {
            console.log('上一页按钮被点击');
            const url = new URL(window.location.href);
            const queryParams = url.searchParams;
            const q = queryParams.get('q');

            if (q) {
              try {
                // 使用js-base64库进行解码
                const decodedQ = Base64.decode(q);
                // 解析JSON
                const queryObject = JSON.parse(decodedQ);
                console.log('queryObject', queryObject);

                // 处理查询对象并返回到上一页
                if (queryObject.o === 'AND' && Array.isArray(queryObject.c)) {
                  // 找出所有name!=条件的索引
                  const nameNotEqualConditions: number[] = [];
                  queryObject.c.forEach((condition: any, index: number) => {
                    if (condition.c === 'name' && condition.o === '!=' && typeof condition.v === 'string') {
                      nameNotEqualConditions.push(index);
                    }
                  });

                  // 确定要删除的条件数量（最多5个）
                  const removeCount = Math.min(5, nameNotEqualConditions.length);

                  if (removeCount > 0) {
                    // 从后往前删除条件（需要按索引从大到小删除以避免删除过程中索引变化问题）
                    const indicesToRemove = nameNotEqualConditions.slice(-removeCount).sort((a, b) => b - a);
                    for (const index of indicesToRemove) {
                      queryObject.c.splice(index, 1);
                    }

                    // 将更新后的queryObject编码回URL
                    const newQueryString = JSON.stringify(queryObject);
                    console.log('新的查询对象:', newQueryString);

                    // 使用js-base64库进行URL安全的Base64编码
                    const base64Encoded = Base64.encodeURI(newQueryString);

                    // 更新URL并跳转
                    queryParams.set('q', base64Encoded);
                    const newUrl = `${url.origin}${url.pathname}?${queryParams.toString()}`;
                    console.log('新的URL:', newUrl);
                    window.location.href = newUrl;
                  } else {
                    console.log('没有找到name!=条件可以删除');
                  }
                }
              } catch (error) {
                console.error('解码失败:', error);
              }
            }
          };

          const button = document.createElement('button');
          button.id = 'custom-action-btn';
          button.className = 'btn btn-primary !ml-2';
          button.textContent = 'Next Page';
          button.onclick = () => {
            console.log('按钮被点击');
            // 这里可以添加按钮点击后的具体操作
            // 获取url的query参数
            const url = new URL(window.location.href);
            const queryParams = url.searchParams;
            const q = queryParams.get('q');

            // 定义处理查询对象的函数
            const processQueryAndRedirect = (queryObject: any) => {
              // 获取table元素的所有Name值
              const table = document.querySelector('table');
              if (table) {
                const nameValues: string[] = [];
                // 获取所有行
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                  // 第三列是Name列（索引从0开始）
                  const nameCell = row.querySelector('td:nth-child(3)');
                  if (nameCell) {
                    const nameLink = nameCell.querySelector('a');
                    if (nameLink) {
                      nameValues.push(nameLink.textContent || '');
                    }
                  }
                });

                // 定义条件类型接口
                interface Condition {
                  c: string;
                  o: string;
                  v: string | number;
                }

                // 收集已有的排除名称
                const existingExcludedNames = new Set<string>();

                // 查找已有的 name != 条件
                if (queryObject.o === 'AND' && Array.isArray(queryObject.c)) {
                  queryObject.c.forEach((condition: Condition) => {
                    if (condition.c === 'name' && condition.o === '!=' && typeof condition.v === 'string') {
                      existingExcludedNames.add(condition.v);
                    }
                  });
                }

                // 添加新的排除名称
                nameValues.forEach(name => {
                  if (!existingExcludedNames.has(name)) {
                    // 添加新的 name != 条件
                    queryObject.c.push({
                      c: 'name',
                      o: '!=',
                      v: name
                    });
                    existingExcludedNames.add(name);
                  }
                });

                // 将更新后的queryObject编码回URL
                const newQueryString = JSON.stringify(queryObject);
                console.log('新的查询对象:', newQueryString);

                // 使用js-base64库进行URL安全的Base64编码
                const base64Encoded = Base64.encodeURI(newQueryString);

                // 更新URL并跳转
                queryParams.set('q', base64Encoded);
                const newUrl = `${url.origin}${url.pathname}?${queryParams.toString()}`;
                console.log('新的URL:', newUrl);
                window.location.href = newUrl;
              }
            };

            // 处理查询参数
            if (q) {
              try {
                // 使用js-base64库进行解码
                const decodedQ = Base64.decode(q);
                // 解析JSON
                const queryObject = JSON.parse(decodedQ);
                console.log('queryObject', queryObject);

                // 使用共用处理函数
                processQueryAndRedirect(queryObject);
              } catch (error) {
                console.error('解码失败:', error);
              }
            } else {
              // 使用默认的查询对象
              const defaultQuery = {
                "o": "AND",
                "c": [
                  {
                    "c": "userCount",
                    "o": ">=",
                    "v": 100000
                  }
                ]
              };

              // 使用共用处理函数
              processQueryAndRedirect(defaultQuery);
            }


          };

          // 创建清空过滤器的按钮
          const clearButton = document.createElement('button');
          clearButton.id = 'clear-filters-btn';
          clearButton.className = 'btn btn-secondary !ml-2';
          clearButton.textContent = 'Clear Filters';
          clearButton.onclick = () => {
            console.log('清空过滤器按钮被点击');
            const url = new URL(window.location.href);
            url.searchParams.delete('q');
            window.location.href = url.toString();
          };

          buttonContainer.appendChild(prevButton);
          buttonContainer.appendChild(button);
          buttonContainer.appendChild(clearButton);
          table.insertAdjacentElement('afterend', buttonContainer);
        }
      }

      // 找到 group-container 元素
      const groupContainer = document.querySelector('.group-container');
      if (groupContainer) {
        // 移动到 .page-controls 后面
        const pageControls = document.querySelector('.page-controls');
        if (pageControls) {
          pageControls.insertAdjacentElement('afterend', groupContainer);
        }
      }

    };

    // 初始执行一次
    removeElements();

    // 监听URL变化
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        console.log('URL变化，重新执行removeElements');
        removeElements();
      }
    });

    // 配置观察选项
    observer.observe(document, { subtree: true, childList: true });
  },
});
