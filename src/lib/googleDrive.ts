import { getAccessToken } from './auth';

export class GoogleDriveService {
  private static async fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('נדרש חיבור לחשבון Google Workspace');
    }

    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errText = await response.text();
      let parsedErr = errText;
      try {
        const json = JSON.parse(errText);
        parsedErr = json.error?.message || errText;
      } catch (_) {}
      throw new Error(`Google Drive API Error: ${parsedErr}`);
    }
    return response.json();
  }

  /**
   * Create or locate folder hierarchy for customer:
   * [Main Folder] -> [CUST_ID - Customer Name] -> [1. הזמנות] & [2. תעודות משלוח]
   */
  static async getOrCreateCustomerFolder(
    parentFolderId: string,
    customerNumber: string,
    customerName: string
  ): Promise<{ rootUrl: string; ordersFolderId: string; deliveryFolderId: string; deliveryFolderUrl: string }> {
    const cleanId = String(customerNumber || 'CUST').replace(/[^\w\d]/g, '');
    const cleanName = String(customerName || 'לקוח כללי').replace(/[\/\\:*?"<>|]/g, '').trim();
    const folderTitle = `[${cleanId}] - ${cleanName}`;

    try {
      // 1. Search if customer folder already exists under parent
      const q = `'${parentFolderId}' in parents and name = '${folderTitle}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const searchRes = await this.fetchWithAuth(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink)`);

      let customerFolderId: string;
      let customerFolderUrl: string;

      if (searchRes.files && searchRes.files.length > 0) {
        customerFolderId = searchRes.files[0].id;
        customerFolderUrl = searchRes.files[0].webViewLink || `https://drive.google.com/drive/folders/${customerFolderId}`;
      } else {
        // Create root folder for customer
        const createRes = await this.fetchWithAuth('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink', {
          method: 'POST',
          body: JSON.stringify({
            name: folderTitle,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentFolderId]
          })
        });
        customerFolderId = createRes.id;
        customerFolderUrl = createRes.webViewLink || `https://drive.google.com/drive/folders/${customerFolderId}`;
      }

      // 2. Ensure subfolders: '1. הזמנות' and '2. תעודות משלוח'
      const ordersSubfolder = await this.getOrCreateSubfolder(customerFolderId, '1. הזמנות');
      const deliverySubfolder = await this.getOrCreateSubfolder(customerFolderId, '2. תעודות משלוח');

      return {
        rootUrl: customerFolderUrl,
        ordersFolderId: ordersSubfolder.id,
        deliveryFolderId: deliverySubfolder.id,
        deliveryFolderUrl: deliverySubfolder.webViewLink
      };
    } catch (err: any) {
      console.warn('Drive folder hierarchy creation fallback:', err);
      // Return safe fallback folder link
      return {
        rootUrl: `https://drive.google.com/drive/folders/${parentFolderId}`,
        ordersFolderId: parentFolderId,
        deliveryFolderId: parentFolderId,
        deliveryFolderUrl: `https://drive.google.com/drive/folders/${parentFolderId}`
      };
    }
  }

  private static async getOrCreateSubfolder(parentId: string, folderName: string) {
    const q = `'${parentId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const searchRes = await this.fetchWithAuth(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink)`);

    if (searchRes.files && searchRes.files.length > 0) {
      return {
        id: searchRes.files[0].id,
        webViewLink: searchRes.files[0].webViewLink || `https://drive.google.com/drive/folders/${searchRes.files[0].id}`
      };
    }

    const createRes = await this.fetchWithAuth('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink', {
      method: 'POST',
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
      })
    });

    return {
      id: createRes.id,
      webViewLink: createRes.webViewLink || `https://drive.google.com/drive/folders/${createRes.id}`
    };
  }
}
