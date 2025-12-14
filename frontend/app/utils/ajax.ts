export function ajaxRequest(
    method: string,
    url: string,
    data?: any,
    headers: Record<string, string> = {}
): Promise<any> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open(method, url)

        // Set default headers
        xhr.setRequestHeader("Content-Type", "application/json")

        // Set custom headers
        Object.keys(headers).forEach(key => {
            xhr.setRequestHeader(key, headers[key])
        })

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    // Start by assuming JSON, fallback to plain text if needed or handle 204
                    if (xhr.status === 204) {
                        resolve(null)
                    } else {
                        const response = JSON.parse(xhr.responseText)
                        resolve(response)
                    }
                } catch (e) {
                    resolve(xhr.responseText)
                }
            } else {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText,
                    response: xhr.responseText
                })
            }
        }

        xhr.onerror = () => {
            reject({
                status: xhr.status,
                statusText: xhr.statusText,
                response: "Network Error"
            })
        }

        if (data) {
            xhr.send(JSON.stringify(data))
        } else {
            xhr.send()
        }
    })
}
