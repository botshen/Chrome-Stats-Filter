import { Base64 } from 'js-base64';

export default defineContentScript({
  matches: ['*://*.chrome-stats.com/*'],
  main() {
    // Function to handle element modifications
    const removeElements = () => {
      // Inject buttons
      const table = document.querySelector('table');
      console.log('table', table)
      if (table) {
        // Check if our buttons already exist to avoid duplicate injection
        const existingButton = document.querySelector('#custom-action-btn');
        const existingClearButton = document.querySelector('#clear-filters-btn');
        const existingPrevButton = document.querySelector('#prev-page-btn');

        if (!existingButton) {
          const buttonContainer = document.createElement('div');
          buttonContainer.style.cssText = 'display: flex; gap: 0.5rem; margin-top: 1rem;';

          // Create Previous Page button
          const prevButton = document.createElement('button');
          prevButton.id = 'prev-page-btn';
          prevButton.className = 'btn btn-primary';
          prevButton.textContent = 'Previous Page';
          prevButton.onclick = () => {
            console.log('Previous page button clicked');
            const url = new URL(window.location.href);
            const queryParams = url.searchParams;
            const q = queryParams.get('q');

            if (q) {
              try {
                // Decode using js-base64 library
                const decodedQ = Base64.decode(q);
                // Parse JSON
                const queryObject = JSON.parse(decodedQ);
                console.log('queryObject', queryObject);

                // Process query object and navigate to previous page
                if (queryObject.o === 'AND' && Array.isArray(queryObject.c)) {
                  // Find all name!= condition indices
                  const nameNotEqualConditions: number[] = [];
                  queryObject.c.forEach((condition: any, index: number) => {
                    if (condition.c === 'name' && condition.o === '!=' && typeof condition.v === 'string') {
                      nameNotEqualConditions.push(index);
                    }
                  });

                  // Determine number of conditions to remove (max 5)
                  const removeCount = Math.min(5, nameNotEqualConditions.length);

                  if (removeCount > 0) {
                    // Remove conditions from back to front (need to delete in descending index order to avoid index change issues)
                    const indicesToRemove = nameNotEqualConditions.slice(-removeCount).sort((a, b) => b - a);
                    for (const index of indicesToRemove) {
                      queryObject.c.splice(index, 1);
                    }

                    // Encode updated queryObject back to URL
                    const newQueryString = JSON.stringify(queryObject);
                    console.log('New query object:', newQueryString);

                    // Use js-base64 library for URL-safe Base64 encoding
                    const base64Encoded = Base64.encodeURI(newQueryString);

                    // Update URL and navigate
                    queryParams.set('q', base64Encoded);
                    const newUrl = `${url.origin}${url.pathname}?${queryParams.toString()}`;
                    console.log('New URL:', newUrl);
                    window.location.href = newUrl;
                  } else {
                    console.log('No name!= conditions found to remove');
                  }
                }
              } catch (error) {
                console.error('Decoding failed:', error);
              }
            }
          };

          const button = document.createElement('button');
          button.id = 'custom-action-btn';
          button.className = 'btn btn-primary !ml-2';
          button.textContent = 'Next Page';
          button.onclick = () => {
            console.log('Button clicked');
            // Add specific actions after button click
            // Get URL query parameters
            const url = new URL(window.location.href);
            const queryParams = url.searchParams;
            const q = queryParams.get('q');

            // Define function to process query and redirect
            const processQueryAndRedirect = (queryObject: any) => {
              // Get all Name values from table
              const table = document.querySelector('table');
              if (table) {
                const nameValues: string[] = [];
                // Get all rows
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                  // Third column is Name column (index starts at 0)
                  const nameCell = row.querySelector('td:nth-child(3)');
                  if (nameCell) {
                    const nameLink = nameCell.querySelector('a');
                    if (nameLink) {
                      nameValues.push(nameLink.textContent || '');
                    }
                  }
                });

                // Define condition type interface
                interface Condition {
                  c: string;
                  o: string;
                  v: string | number;
                }

                // Collect existing excluded names
                const existingExcludedNames = new Set<string>();

                // Find existing name != conditions
                if (queryObject.o === 'AND' && Array.isArray(queryObject.c)) {
                  queryObject.c.forEach((condition: Condition) => {
                    if (condition.c === 'name' && condition.o === '!=' && typeof condition.v === 'string') {
                      existingExcludedNames.add(condition.v);
                    }
                  });
                }

                // Add new excluded names
                nameValues.forEach(name => {
                  if (!existingExcludedNames.has(name)) {
                    // Add new name != condition
                    queryObject.c.push({
                      c: 'name',
                      o: '!=',
                      v: name
                    });
                    existingExcludedNames.add(name);
                  }
                });

                // Encode updated queryObject back to URL
                const newQueryString = JSON.stringify(queryObject);
                console.log('New query object:', newQueryString);

                // Check if condition count has reached 60
                const nameNotEqualConditionsCount = queryObject.c.filter(
                  (condition: Condition) => condition.c === 'name' && condition.o === '!='
                ).length;

                if (nameNotEqualConditionsCount >= 60) {
                  console.log('Filter conditions have reached maximum number (60), cannot add more');
                  alert('Filter conditions have reached maximum number (60), cannot add more');
                  return;
                }

                // Use js-base64 library for URL-safe Base64 encoding
                const base64Encoded = Base64.encodeURI(newQueryString);

                // Update URL and navigate
                queryParams.set('q', base64Encoded);
                const newUrl = `${url.origin}${url.pathname}?${queryParams.toString()}`;
                console.log('New URL:', newUrl);
                window.location.href = newUrl;
              }
            };

            // Process query parameters
            if (q) {
              try {
                // Decode using js-base64 library
                const decodedQ = Base64.decode(q);
                // Parse JSON
                const queryObject = JSON.parse(decodedQ);
                console.log('queryObject', queryObject);

                // Use shared processing function
                processQueryAndRedirect(queryObject);
              } catch (error) {
                console.error('Decoding failed:', error);
              }
            } else {
              // Use default query object
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

              // Use shared processing function
              processQueryAndRedirect(defaultQuery);
            }


          };

          // Create Clear Filters button
          const clearButton = document.createElement('button');
          clearButton.id = 'clear-filters-btn';
          clearButton.className = 'btn btn-secondary !ml-2';
          clearButton.textContent = 'Clear Filters';
          clearButton.onclick = () => {
            console.log('Clear filters button clicked');
            const url = new URL(window.location.href);
            url.searchParams.delete('q');
            window.location.href = url.toString();
          };

          buttonContainer.appendChild(prevButton);
          buttonContainer.appendChild(button);
          buttonContainer.appendChild(clearButton);
          table.insertAdjacentElement('afterend', buttonContainer);

          // Display filter condition count (if query parameters exist)
          const url = new URL(window.location.href);
          const queryParams = url.searchParams;
          const q = queryParams.get('q');

          if (q) {
            try {
              const decodedQ = Base64.decode(q);
              const queryObject = JSON.parse(decodedQ);

              if (queryObject.o === 'AND' && Array.isArray(queryObject.c)) {
                const nameNotEqualConditions = queryObject.c.filter(
                  (condition: any) => condition.c === 'name' && condition.o === '!='
                );

                const filterCountInfo = document.createElement('div');
                filterCountInfo.id = 'filter-count-info';
                filterCountInfo.className = 'text-sm text-gray-600 mt-2';
                filterCountInfo.textContent = `Currently ${nameNotEqualConditions.length} filtered applications`;
                buttonContainer.after(filterCountInfo);

                // If filter conditions exceed 60, disable the "Next Page" button
                const nextPageBtn = document.getElementById('custom-action-btn') as HTMLButtonElement;
                if (nextPageBtn && nameNotEqualConditions.length >= 60) {
                  nextPageBtn.disabled = true;
                  nextPageBtn.title = "Maximum filter count reached (60)";
                  nextPageBtn.className = 'btn btn-secondary !ml-2 opacity-50 cursor-not-allowed';
                }
              }
            } catch (error) {
              console.error('Failed to parse query parameters:', error);
            }
          }
        }
      }

      // Find the group-container element
      const groupContainer = document.querySelector('.group-container');
      if (groupContainer) {
        // Move after .page-controls
        const pageControls = document.querySelector('.page-controls');
        if (pageControls) {
          pageControls.insertAdjacentElement('afterend', groupContainer);
        }
      }

    };

    // 确保元素持续存在，监听DOM变化
    const setupDomObserver = () => {
      // 先执行一次初始注入
      removeElements();

      // 创建MutationObserver监听DOM变化
      const domObserver = new MutationObserver((mutations) => {
        // 检查是否需要重新注入按钮
        const customButton = document.querySelector('#custom-action-btn');
        const table = document.querySelector('table');

        if (table && !customButton) {
          console.log('Table exists but custom button missing, re-injecting elements');
          removeElements();
        }
      });

      // 配置观察选项
      domObserver.observe(document.body, {
        childList: true,
        subtree: true
      });

      return domObserver;
    };

    // 初始执行
    setupDomObserver();
  },
});
