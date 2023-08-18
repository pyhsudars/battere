/**
 * Copyright 2022 Amazon.com, Inc. and its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import { Injectable } from "@angular/core";
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpEventType, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { AuthService } from "../services/auth.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService) {}
    
    responseData: unknown = { message: 'Data received successfuly' };

    //creating an instance of HttpResponseUnknown
    response= new HttpResponse<unknown>({
        body: this.responseData,
        status: 200,
        statusText: 'OK'
    });



    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        if (request.url.includes("/api/") && !request.url.includes("/api/amplify-config")) {
            const cloneRequest = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${this.authService.getToken()}`,
                },
            });
            return next.handle(cloneRequest);
        } else {
            console.log("hi");
            return new Observable( observer => {
                observer.next()
                observer.complete()
            });      
       
        }
    }
}
