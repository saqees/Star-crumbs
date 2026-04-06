import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  uploadImage(base64: string, folder = 'star-crumbs') {
    return this.http.post<{ url: string; public_id: string }>(
      `${this.api}/upload`,
      { data: base64, folder }
    );
  }

  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  }
}
