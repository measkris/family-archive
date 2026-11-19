import { NextRequest, NextResponse } from 'next/server';
import { getCloudinaryConfig, uploadImageToCloudinary } from '@/lib/cloudinary';
import { getAuthenticatedUser } from '@/lib/auth/server';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 10 * 1024 * 1024; // 10MB Cloudinary free tier image limit

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to upload portraits.' },
        { status: 401 }
      );
    }
    if (!getCloudinaryConfig()) {
      return NextResponse.json(
        {
          error:
            'Cloudinary credentials missing in .env. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET (or CLOUDINARY_URL) and restart dev server.',
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Only JPG, PNG, WEBP, or GIF images are allowed' },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Image must be under 10MB' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const result = await uploadImageToCloudinary(bytes, file.type, {
      folder: 'family-tree/portraits',
    });

    return NextResponse.json(
      {
        url: result.secureUrl,
        publicId: result.publicId,
        storage: 'cloudinary',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/upload (Cloudinary) error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to upload image to Cloudinary',
      },
      { status: 500 }
    );
  }
}
