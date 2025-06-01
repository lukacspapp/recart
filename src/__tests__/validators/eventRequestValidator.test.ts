import { validateBatchEventRequest } from '../../middleware/validators/eventRequestValidator';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { getValidatorErrors } from '../../middleware/validators/validationUtils';
import { Request, Response, NextFunction } from 'express';
import { TSchema } from '@sinclair/typebox';

jest.mock('@sinclair/typebox/compiler', () => ({
  TypeCompiler: {
    Compile: jest.fn().mockReturnValue({
      Check: jest.fn(),
    }),
  },
}));

jest.mock('../../middleware/validators/validationUtils', () => ({
  getValidatorErrors: jest.fn(),
}));

describe('validateBatchEventRequest', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let mockValidator: { Check: jest.Mock };

  beforeEach(() => {
    mockRequest = {
      body: undefined,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    mockNext = jest.fn();

    mockValidator = TypeCompiler.Compile('' as unknown as TSchema) as unknown as { Check: jest.Mock };

    jest.clearAllMocks();
  });

  it('should call next() for valid request body', () => {
    mockRequest.body = [
      {
        eventType: 'order.created',
        data: { orderId: 'ord_123', value: 99.99 }
      }
    ];

    mockValidator.Check.mockReturnValue(true);

    validateBatchEventRequest(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockValidator.Check).toHaveBeenCalledWith(mockRequest.body);

    expect(mockNext).toHaveBeenCalled();

    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.send).not.toHaveBeenCalled();
  });

  it('should return 400 for missing request body', () => {
    mockRequest.body = null;

    validateBatchEventRequest(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.send).toHaveBeenCalledWith('Invalid request body.');

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 400 for non-object request body', () => {
    mockRequest.body = 'not an object' as any;

    validateBatchEventRequest(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.send).toHaveBeenCalledWith('Invalid request body.');

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 400 with validation errors for invalid request body', () => {
    mockRequest.body = [{ invalid: 'data' }];

    mockValidator.Check.mockReturnValue(false);

    const mockErrors = [
      { path: '[0].eventType', message: 'Required' },
      { path: '[0].data', message: 'Required' }
    ];
    (getValidatorErrors as jest.Mock).mockReturnValue(mockErrors);

    validateBatchEventRequest(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockValidator.Check).toHaveBeenCalledWith(mockRequest.body);

    expect(getValidatorErrors).toHaveBeenCalled();

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.send).toHaveBeenCalledWith(
      'Invalid request body. Errors: [0].eventType: Required, [0].data: Required'
    );

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should pass errors to next() for exceptions', () => {
    mockRequest.body = [{ eventType: 'test', data: { orderId: '123', value: 10 } }];

    const testError = new Error('Validation system error');
    mockValidator.Check.mockImplementation(() => {
      throw testError;
    });

    validateBatchEventRequest(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(testError);

    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.send).not.toHaveBeenCalled();
  });
});
