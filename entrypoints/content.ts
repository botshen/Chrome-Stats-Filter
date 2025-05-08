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

        if (!existingButton) {
          const buttonContainer = document.createElement('div');
          buttonContainer.className = 'flex gap-2 mt-4';

          const button = document.createElement('button');
          button.id = 'custom-action-btn';
          button.className = 'btn btn-primary';
          button.textContent = 'Next Page';
          button.onclick = () => {
            console.log('按钮被点击');
            // 这里可以添加按钮点击后的具体操作
            // 获取url的query参数
            const url = new URL(window.location.href);
            const queryParams = url.searchParams;
            const q = queryParams.get('q');
            // q 是base64编码的，需要解码
            if (q) {
              try {
                // 使用js-base64库进行解码
                const decodedQ = Base64.decode(q);

                // 解析JSON
                const queryObject = JSON.parse(decodedQ);
                console.log('queryObject', queryObject)
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
              } catch (error) {
                console.error('解码失败:', error);
              }
            } else {
              const _q = 'eyJvIjoiQU5EIiwiYyI6W3siYyI6InVzZXJDb3VudCIsIm8iOiI-PSIsInYiOjEwMDAwMH0seyJjIjoibmFtZSIsIm8iOiIhPSIsInYiOiJkb250LXJlbW92ZS1tZSJ9XX0'
              // 设置 q 为 _q
              queryParams.set('q', _q);
              const newUrl = `${url.origin}${url.pathname}?${queryParams.toString()}`;
              console.log('新的URL:', newUrl);
              window.location.href = newUrl;
            }
          };

          // 创建清空过滤器的按钮
          const clearButton = document.createElement('button');
          clearButton.id = 'clear-filters-btn';
          clearButton.className = 'btn btn-secondary';
          clearButton.textContent = '清空过滤器';
          clearButton.onclick = () => {
            console.log('清空过滤器按钮被点击');
            const url = new URL(window.location.href);
            url.searchParams.delete('q');
            window.location.href = url.toString();
          };

          buttonContainer.appendChild(button);
          buttonContainer.appendChild(clearButton);
          table.insertAdjacentElement('afterend', buttonContainer);
        }
      }
      // 删除升级提示链接
      const upgradeLinks = document.querySelectorAll('a.btn-danger[href="/pricing"]');
      upgradeLinks.forEach(link => {
        if (link.textContent?.includes('Only 5 records are shown')) {
          link.remove();
        }
      });
      return;
      const groupContainers = document.querySelectorAll('div.group-container');
      console.log('groupContainers', groupContainers);
      groupContainers.forEach(container => {
        container.remove();
      });





    };

    // 初始执行一次
    removeElements();

    // 监听 URL 变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          removeElements();
        }
      });
    });

    // 监听 body 元素的变化
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  },
});
